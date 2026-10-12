import { getQuarterFromDate } from "@/lib/ledger-utils"
import {
  belongsToCashflowBank,
  getCashflowPreviousBalance,
} from "@/lib/cashflow-utils"
import { generateNextId } from "@/lib/id-utils"
import {
  CashflowImportBank,
  CashflowImportMovement,
  getCashflowImportDefinition,
} from "./import-definitions"
import {
  buildCashflowImportLogContent,
  createCashflowImportLogPath,
  makeCashflowImportLogRecord,
} from "./import-log"
import {
  findMatchingEntry,
  normalizeImportedBankEntries,
  resolveImportedBankName,
} from "./import-normalize"
import { CashflowEntry } from "@/lib/types"
import { CashflowImportLogRecord } from "./import-log"

function getUniqueExternalId(
  externalId: string | undefined,
  entries: CashflowEntry[]
): string | undefined {
  if (!externalId || externalId.length < 8) return undefined
  const existingIds = new Set(entries.map((entry) => entry.id))
  for (let length = 8; length <= externalId.length; length++) {
    const candidate = externalId.slice(0, length)
    if (!existingIds.has(candidate)) return candidate
  }
  throw new Error("Duplicate external transaction ID; refusing duplicate entry")
}

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
    belongsToCashflowBank(entry, bankName)
  )
  const openingEntry = targetEntries.find(
    (entry) => entry.income == null && entry.expense == null
  )
  const firstMovement = targetEntries
    .filter((entry) => entry.income != null || entry.expense != null)
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        (left.bankSequence ?? Number.MAX_SAFE_INTEGER) -
          (right.bankSequence ?? Number.MAX_SAFE_INTEGER)
    )[0]
  const openingBalance =
    openingEntry?.balance ??
    (firstMovement ? getCashflowPreviousBalance(firstMovement) : 0)
  const matchedIds = new Set<string>()
  const processedExternalIds = new Set<string>()
  const entryImportOrder = new Map<string, number>()
  const entryBankSequence = new Map<string, number>()
  const logRecords: CashflowImportLogRecord[] = []
  let nextEntries = [...entries]
  let created = 0
  let existing = 0
  let otherQuarter = 0
  let ignored = 0
  let orderIndex = 0

  const sortedMovements = sortImportMovements(movements, bank, quarterId)

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

    if (processedExternalIds.has(movement.externalId)) {
      throw new Error(
        "Duplicate external transaction ID in CSV; refusing ambiguous import"
      )
    }
    processedExternalIds.add(movement.externalId)

    const match = findMatchingEntry(targetEntries, matchedIds, movement)
    if (match) {
      matchedIds.add(match.id)
      entryImportOrder.set(match.id, orderIndex)
      if (movement.bankSequence != null) {
        entryBankSequence.set(match.id, movement.bankSequence)
      }
      orderIndex += 1
      existing += 1
      logRecords.push(
        makeCashflowImportLogRecord(movement, "Existente", match.id)
      )
      continue
    }

    const newEntry: CashflowEntry = {
      id:
        getUniqueExternalId(movement.externalId, nextEntries) ??
        generateNextId(nextEntries, "cf"),
      date: movement.date,
      concept: movement.concept,
      bankName,
      income: movement.income,
      expense: movement.expense,
      balance: 0,
    }
    nextEntries = [...nextEntries, newEntry]
    targetEntries.push(newEntry)
    matchedIds.add(newEntry.id)
    entryImportOrder.set(newEntry.id, orderIndex)
    if (movement.bankSequence != null) {
      entryBankSequence.set(newEntry.id, movement.bankSequence)
    }
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
    entryImportOrder,
    entryBankSequence
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

function sortImportMovements(
  movements: CashflowImportMovement[],
  bank: CashflowImportBank,
  quarterId: string
): CashflowImportMovement[] {
  const sorted = [...movements].sort(
    (left, right) =>
      left.date.localeCompare(right.date) || left.sourceLine - right.sourceLine
  )
  if (bank !== "revolut") return sorted

  const result: CashflowImportMovement[] = []
  for (let index = 0; index < sorted.length; ) {
    const first = sorted[index]
    let end = index + 1
    while (end < sorted.length && sorted[end].date === first.date) end++
    const group = sorted.slice(index, end)
    const active = group.filter(
      (movement) =>
        !movement.skipReason &&
        /^\d{4}-\d{2}-\d{2}$/.test(movement.date) &&
        getQuarterFromDate(movement.date) === quarterId
    )

    if (active.length > 1) {
      result.push(
        ...group.filter((movement) => !active.includes(movement)),
        ...orderRevolutSameDayMovements(active, first.date)
      )
    } else {
      result.push(...group)
    }
    index = end
  }
  return result
}

function orderRevolutSameDayMovements(
  movements: CashflowImportMovement[],
  date: string
): CashflowImportMovement[] {
  if (movements.some((movement) => movement.balanceAfter == null)) {
    throw new Error(
      `Cannot order Revolut movements for ${date}: missing or invalid Balance values`
    )
  }

  const previousBalance = (movement: CashflowImportMovement) =>
    toCents(movement.balanceAfter!) - toCents(movement.amount)
  const balanceAfter = (movement: CashflowImportMovement) =>
    toCents(movement.balanceAfter!)
  const starts = movements.filter(
    (movement) =>
      !movements.some(
        (other) =>
          other !== movement &&
          balanceAfter(other) === previousBalance(movement)
      )
  )
  if (starts.length !== 1) {
    throw new Error(
      `Cannot determine Revolut transaction order for ${date} from Balance values`
    )
  }

  const remaining = new Set(movements)
  const ordered: CashflowImportMovement[] = []
  let current = starts[0]
  while (remaining.size > 0) {
    if (!remaining.delete(current)) {
      throw new Error(
        `Cannot determine Revolut transaction order for ${date} from Balance values`
      )
    }
    ordered.push(current)
    if (remaining.size === 0) break

    const following = [...remaining].filter(
      (movement) => previousBalance(movement) === balanceAfter(current)
    )
    if (following.length !== 1) {
      throw new Error(
        `Cannot determine Revolut transaction order for ${date} from Balance values`
      )
    }
    current = following[0]
  }
  return ordered
}

function toCents(amount: number): number {
  return Math.round(amount * 100)
}
