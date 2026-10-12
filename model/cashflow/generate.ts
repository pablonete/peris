import { access, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { CashflowEntry } from "@/lib/types"
import { getQuarterFromDate } from "@/lib/ledger-utils"
import { parseCsvRecords } from "@/lib/csv-utils"
import {
  cashflowImportDefinitions,
  getCashflowImportDefinition,
  CashflowImportBank,
} from "./import-definitions"
import { importCashflowFile } from "./import"

export interface CashflowSourceSummary {
  file: string
  logFile: string
  bank: string
  quarterRows: number
  created: number
  existing: number
  ignored: number
  sequenceFixed: number
}

export interface GenerateCashflowResult {
  quarterId: string
  changed: boolean
  sources: CashflowSourceSummary[]
  totals: Omit<
    CashflowSourceSummary,
    "file" | "logFile" | "bank" | "quarterRows"
  >
}

interface MonthRange {
  start: number
  end: number
}

interface CsvSource {
  fileName: string
  bank: CashflowImportBank
  content: string
  quarterRows: number
  ignoredQuarterRows: number
  statementRange: MonthRange | null
}

export async function generateCashflowForQuarter({
  quarterId,
  dataRepoPath,
  now = new Date(),
}: {
  quarterId: string
  dataRepoPath: string
  now?: Date
}): Promise<GenerateCashflowResult> {
  validateQuarterId(quarterId)

  const repositoryPath = path.resolve(dataRepoPath)
  const importPath = path.join(repositoryPath, "import")
  const cashflowPath = path.join(repositoryPath, quarterId, "cashflow.json")
  const originalContent = await readFile(cashflowPath, "utf8").catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        throw new Error(
          `Missing ${quarterId}/cashflow.json in ${repositoryPath}`
        )
      }
      throw error
    }
  )

  let originalEntries: CashflowEntry[]
  try {
    const parsed: unknown = JSON.parse(originalContent)
    if (!Array.isArray(parsed)) {
      throw new Error("Cashflow JSON must be an array")
    }
    if (!parsed.every(isCashflowEntry)) {
      throw new Error("Cashflow JSON contains an invalid entry")
    }
    originalEntries = parsed
  } catch (error) {
    throw new Error(
      `Cannot read ${quarterId}/cashflow.json: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  const csvFiles = (await readdir(importPath, { withFileTypes: true }))
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv")
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))

  const candidates: CsvSource[] = []
  for (const fileName of csvFiles) {
    const rawContent = await readFile(path.join(importPath, fileName), "utf8")
    const content = rawContent.replace(/^\uFEFF/, "")
    const records = parseCsvRecords(content)
    const headers = Object.keys(records[0] ?? {})
    const matchingDefinitions = cashflowImportDefinitions.filter((definition) =>
      Object.values(definition.columns).every((column) =>
        headers.includes(column)
      )
    )

    if (matchingDefinitions.length > 1) {
      throw new Error(`Ambiguous bank format in import/${fileName}`)
    }
    if (matchingDefinitions.length === 0) continue

    const definition = matchingDefinitions[0]
    const movements = definition.parse(content)
    const quarterMovements = movements.filter((movement) =>
      isDateInQuarter(movement.date, quarterId)
    )
    const statementRange = parseFileRange(fileName)
    if (
      quarterMovements.length === 0 &&
      !rangeCoversQuarter(statementRange, quarterId)
    ) {
      continue
    }

    candidates.push({
      fileName,
      bank: definition.id,
      content,
      quarterRows: quarterMovements.length,
      ignoredQuarterRows: quarterMovements.filter(
        (movement) => movement.skipReason
      ).length,
      statementRange,
    })
  }

  const sources: CsvSource[] = []
  for (const definition of cashflowImportDefinitions) {
    const bankCandidates = candidates.filter(
      (source) => source.bank === definition.id
    )
    const bankIsPresent = originalEntries.some(
      (entry) => entry.bankName === definition.label
    )
    const quarterCoveringStatements = bankCandidates.filter((source) =>
      rangeCoversQuarter(source.statementRange, quarterId)
    )

    if (!bankIsPresent && bankCandidates.length > 0) {
      throw new Error(
        `Found ${definition.label} statements for ${quarterId} but no existing ${definition.label} baseline in ${quarterId}/cashflow.json`
      )
    }
    if (!bankIsPresent) continue
    if (quarterCoveringStatements.length !== 1) {
      const names = bankCandidates.map((source) => source.fileName).join(", ")
      throw new Error(
        `Expected exactly one ${definition.label} CSV whose filename range covers all of ${quarterId}; found ${quarterCoveringStatements.length}${names ? ` (candidates: ${names})` : ""}`
      )
    }

    const selected = quarterCoveringStatements[0]
    const extraQuarterFiles = bankCandidates.filter(
      (source) =>
        source.fileName !== selected.fileName && source.quarterRows > 0
    )
    if (extraQuarterFiles.length > 0) {
      throw new Error(
        `Multiple ${definition.label} CSVs contain ${quarterId} rows; refusing overlapping imports: ${[selected, ...extraQuarterFiles].map((source) => source.fileName).join(", ")}`
      )
    }
    sources.push(selected)
  }

  if (sources.length === 0) {
    throw new Error(`No supported statements found for ${quarterId}`)
  }

  sources.sort((left, right) => left.bank.localeCompare(right.bank))

  let entries = originalEntries
  const sourceSummaries: CashflowSourceSummary[] = []
  const generatedLogs: Array<{ file: string; content: string }> = []

  for (const source of sources) {
    const definition = getCashflowImportDefinition(source.bank)
    const existingBankEntries = entries.filter(
      (entry) => entry.bankName === definition.label
    )
    if (existingBankEntries.length === 0) {
      throw new Error(
        `No existing ${definition.label} baseline in ${quarterId}/cashflow.json; refusing to calculate balances from zero`
      )
    }

    const result = importCashflowFile({
      bank: source.bank,
      csvContent: source.content,
      fileName: source.fileName,
      quarterId,
      entries,
      now,
    })
    entries = result.entries
    generatedLogs.push({ file: result.logPath, content: result.logContent })
    sourceSummaries.push({
      file: source.fileName,
      logFile: result.logPath,
      bank: definition.label,
      quarterRows: source.quarterRows,
      created: result.summary.created,
      existing: result.summary.existing,
      ignored: source.ignoredQuarterRows,
      sequenceFixed: result.summary.sequenceFixed,
    })
  }

  // Match the UI import workflow: preserve the importer’s row-level audit log
  // beside its source CSV. Check all paths first, then use exclusive creation
  // so timestamp collisions cannot silently overwrite an earlier import log.
  for (const log of generatedLogs) {
    const logPath = path.join(repositoryPath, log.file)
    try {
      await access(logPath)
      throw new Error(`Refusing to overwrite existing import log: ${log.file}`)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }
  for (const log of generatedLogs) {
    await writeFile(path.join(repositoryPath, log.file), log.content, {
      encoding: "utf8",
      flag: "wx",
    })
  }

  const changed = JSON.stringify(entries) !== JSON.stringify(originalEntries)
  if (changed) {
    await writeFile(
      cashflowPath,
      `${JSON.stringify(entries, null, 2)}\n`,
      "utf8"
    )
  }

  return {
    quarterId,
    changed,
    sources: sourceSummaries,
    totals: sourceSummaries.reduce(
      (total, source) => ({
        created: total.created + source.created,
        existing: total.existing + source.existing,
        ignored: total.ignored + source.ignored,
        sequenceFixed: total.sequenceFixed + source.sequenceFixed,
      }),
      { created: 0, existing: 0, ignored: 0, sequenceFixed: 0 }
    ),
  }
}

function isCashflowEntry(value: unknown): value is CashflowEntry {
  if (typeof value !== "object" || value === null) return false
  const entry = value as Partial<CashflowEntry>
  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    typeof entry.concept === "string" &&
    typeof entry.balance === "number" &&
    Number.isFinite(entry.balance)
  )
}

function validateQuarterId(quarterId: string): void {
  if (!/^\d{4}\.[1-4]Q$/.test(quarterId)) {
    throw new Error(
      `Invalid quarter '${quarterId}'; expected YYYY.NQ, e.g. 2031.2Q`
    )
  }
}

function isDateInQuarter(date: string, quarterId: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) && getQuarterFromDate(date) === quarterId
  )
}

function parseFileRange(fileName: string): MonthRange | null {
  const match = fileName.match(/(\d{4})-(\d{2})[_-](\d{4})-(\d{2})/)
  if (!match) return null

  const [, startYear, startMonth, endYear, endMonth] = match
  const startMonthNumber = Number(startMonth)
  const endMonthNumber = Number(endMonth)
  if (
    startMonthNumber < 1 ||
    startMonthNumber > 12 ||
    endMonthNumber < 1 ||
    endMonthNumber > 12
  ) {
    return null
  }

  const start = Number(startYear) * 12 + startMonthNumber
  const end = Number(endYear) * 12 + endMonthNumber
  return start <= end ? { start, end } : null
}

function rangeCoversQuarter(
  range: MonthRange | null,
  quarterId: string
): boolean {
  if (!range) return false
  const [quarterYear, quarterNumber] = quarterId.split(".")
  const firstQuarterMonth = (Number(quarterNumber[0]) - 1) * 3 + 1
  const lastQuarterMonth = firstQuarterMonth + 2
  const quarterStart = Number(quarterYear) * 12 + firstQuarterMonth
  const quarterEnd = Number(quarterYear) * 12 + lastQuarterMonth

  return range.start <= quarterStart && range.end >= quarterEnd
}
