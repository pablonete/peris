import { getQuarterFromDate } from "./ledger-utils"
import { getCashflowPreviousBalance } from "./cashflow-utils"
import { generateNextId } from "./id-utils"
import {
  CashflowImportBank,
  getCashflowImportDefinition,
} from "./cashflow-import-definitions"
import {
  buildCashflowImportLogContent,
  createCashflowImportLogPath,
  makeCashflowImportLogRecord,
} from "./cashflow-import-log"
import {
  findMatchingEntry,
  normalizeImportedBankEntries,
  resolveImportedBankName,
} from "./cashflow-import-normalize"
import { CashflowEntry } from "./types"

export interface CashflowImportSummary {
  processed: number
  otherQuarter: number
  existing: number
  created: number
  ignored: number
  sequenceFixed: number
}

export interface CashflowImportResult {
  entries: CashflowEntry[]
  summary: CashflowImportSummary
  logContent: string
  logPath: string
}

export function importCashflowFile({
  bank,
  csvContent,
  fileName,
  quarterId,
  entries,
  now = new Date(),
}: {
  bank: CashflowImportBank
  csvContent: string
  fileName: string
  quarterId: string
  entries: CashflowEntry[]
  now?: Date
}): CashflowImportResult {
  const definition = getCashflowImportDefinition(bank)
  const movements = definition.parse(csvContent)
  const bankName = resolveImportedBankName(entries, definition.label)
  const targetEntries = entries.filter((entry) =>
    belongsToBank(entry, bankName)
  )
  const openingBalance = targetEntries.length
    ? getCashflowPreviousBalance(targetEntries[0])
    : 0
  const matchedIds = new Set<string>()
  const importedOrder = new Map<string, number>()
  const logRecords = []
  let nextEntries = [...entries]
  let created = 0
  let existing = 0
  let otherQuarter = 0
  let ignored = 0
  let orderIndex = 0

  const sortedMovements = [...movements].sort(
    (left, right) =>
      left.date.localeCompare(right.date) || left.sourceLine - right.sourceLine
  )

  for (const movement of sortedMovements) {
    if (movement.skipReason) {
      ignored += 1
      logRecords.push(
        makeCashflowImportLogRecord(movement, "Ignorado", movement.skipReason)
      )
      continue
    }

    if (getQuarterFromDate(movement.date) !== quarterId) {
      otherQuarter += 1
      logRecords.push(
        makeCashflowImportLogRecord(movement, "Otro trimestre", quarterId)
      )
      continue
    }

    const match = findMatchingEntry(targetEntries, matchedIds, movement)
    if (match) {
      matchedIds.add(match.id)
      importedOrder.set(match.id, orderIndex)
      orderIndex += 1
      existing += 1
      logRecords.push(
        makeCashflowImportLogRecord(movement, "Existente", match.id)
      )
      continue
    }

    const newEntry: CashflowEntry = {
      id: generateNextId(nextEntries, "cf"),
      date: movement.date,
      concept: movement.concept,
      bankName,
      income: movement.income,
      expense: movement.expense,
      balance: 0,
    }
    nextEntries = [...nextEntries, newEntry]
    targetEntries.push(newEntry)
    importedOrder.set(newEntry.id, orderIndex)
    orderIndex += 1
    created += 1
    logRecords.push(
      makeCashflowImportLogRecord(movement, "Creado", newEntry.id)
    )
  }

  const sequenceBefore = new Map(
    entries.map((entry) => [entry.id, entry.bankSequence])
  )
  const normalizedEntries = normalizeImportedBankEntries(
    nextEntries,
    bankName,
    openingBalance,
    importedOrder
  )
  const sequenceFixed = normalizedEntries.reduce((count, entry) => {
    const previous = sequenceBefore.get(entry.id)
    return previous !== undefined && previous !== entry.bankSequence
      ? count + 1
      : count
  }, 0)

  return {
    entries: normalizedEntries,
    summary: {
      processed: movements.length,
      otherQuarter,
      existing,
      created,
      ignored,
      sequenceFixed,
    },
    logContent: buildCashflowImportLogContent(
      fileName,
      quarterId,
      logRecords,
      normalizedEntries,
      {
        processed: movements.length,
        otherQuarter,
        existing,
        created,
        ignored,
        sequenceFixed,
      }
    ),
    logPath: createCashflowImportLogPath(fileName, now),
  }
}

function belongsToBank(
  entry: CashflowEntry,
  bankName: string | undefined
): boolean {
  return bankName == null ? !entry.bankName : entry.bankName === bankName
}
