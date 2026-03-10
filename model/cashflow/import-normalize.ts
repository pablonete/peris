import { belongsToCashflowBank } from "@/lib/cashflow-utils"
import { parseEntryDate } from "@/lib/date-utils"
import { CashflowEntry } from "@/lib/types"
import { CashflowImportMovement } from "./import-definitions"

// Allow a few days of difference because card settlements can be booked after the purchase date.
const IMPORT_DATE_TOLERANCE_DAYS = 3

export function normalizeImportedBankEntries(
  entries: CashflowEntry[],
  bankName: string | undefined,
  openingBalance: number,
  entryImportOrder: Map<string, number>,
  entryBankSequence: Map<string, number> = new Map()
): CashflowEntry[] {
  const originalOrder = new Map(
    entries.map((entry, index) => [entry.id, index])
  )
  const bankEntries = entries.filter((entry) =>
    belongsToCashflowBank(entry, bankName)
  )
  const otherEntries = entries.filter(
    (entry) => !belongsToCashflowBank(entry, bankName)
  )
  const carryOvers = bankEntries.filter(isCarryOverEntry)
  const regularEntries = bankEntries
    .filter((entry) => !isCarryOverEntry(entry))
    .sort((left, right) =>
      compareImportedEntries(
        left,
        right,
        entryImportOrder,
        originalOrder,
        entryBankSequence
      )
    )

  let balance = openingBalance
  let autoSequence = 1
  const normalizedBankEntries = [
    ...carryOvers.map((entry) => ({
      ...entry,
      balance: openingBalance,
      bankSequence: undefined,
    })),
    ...regularEntries.map((entry) => {
      balance = roundCurrency(
        balance + (entry.income ?? 0) - (entry.expense ?? 0)
      )
      const csvSeq = entryBankSequence.get(entry.id)
      const bankSeq = csvSeq ?? autoSequence
      if (csvSeq == null) autoSequence += 1
      return { ...entry, balance, bankSequence: bankSeq, bankName }
    }),
  ]

  return [...otherEntries, ...normalizedBankEntries].sort(
    (left, right) =>
      left.date.localeCompare(right.date) ||
      compareImportedEntries(
        left,
        right,
        entryImportOrder,
        originalOrder,
        entryBankSequence
      )
  )
}

export function findMatchingEntry(
  entries: CashflowEntry[],
  matchedIds: Set<string>,
  movement: CashflowImportMovement
): CashflowEntry | undefined {
  return entries
    .filter((entry) => !matchedIds.has(entry.id) && !isCarryOverEntry(entry))
    .filter((entry) => getSignedAmount(entry) === movement.amount)
    .filter(
      (entry) =>
        getMinimumDateDistance(entry.date, movement.matchDates) <=
        IMPORT_DATE_TOLERANCE_DAYS
    )
    .sort(
      (left, right) =>
        getMinimumDateDistance(left.date, movement.matchDates) -
        getMinimumDateDistance(right.date, movement.matchDates)
    )[0]
}

export function resolveImportedBankName(
  entries: CashflowEntry[],
  bankName: string
): string | undefined {
  const existingBanks = new Set(
    entries.map((entry) => entry.bankName).filter(Boolean)
  )
  return existingBanks.size === 0 ? undefined : bankName
}

function compareImportedEntries(
  left: CashflowEntry,
  right: CashflowEntry,
  entryImportOrder: Map<string, number>,
  originalOrder: Map<string, number>,
  entryBankSequence?: Map<string, number>
): number {
  if (entryBankSequence) {
    const leftSeq = entryBankSequence.get(left.id)
    const rightSeq = entryBankSequence.get(right.id)
    if (leftSeq != null && rightSeq != null) return leftSeq - rightSeq
    if (leftSeq != null) return -1
    if (rightSeq != null) return 1
  }
  const leftImported = entryImportOrder.get(left.id)
  const rightImported = entryImportOrder.get(right.id)
  if (leftImported != null && rightImported != null)
    return leftImported - rightImported
  if (leftImported != null) return -1
  if (rightImported != null) return 1
  return (
    (left.bankSequence ?? Number.MAX_SAFE_INTEGER) -
      (right.bankSequence ?? Number.MAX_SAFE_INTEGER) ||
    (originalOrder.get(left.id) ?? 0) - (originalOrder.get(right.id) ?? 0)
  )
}

function isCarryOverEntry(entry: CashflowEntry): boolean {
  return (
    entry.concept === "Carry over" &&
    entry.income == null &&
    entry.expense == null
  )
}

function getSignedAmount(entry: CashflowEntry): number {
  return roundCurrency((entry.income ?? 0) - (entry.expense ?? 0))
}

function getMinimumDateDistance(date: string, matchDates: string[]): number {
  return Math.min(
    ...matchDates.map((matchDate) => getDateDistance(date, matchDate))
  )
}

function getDateDistance(left: string, right: string): number {
  return (
    Math.abs(parseEntryDate(left).getTime() - parseEntryDate(right).getTime()) /
    (24 * 60 * 60 * 1000)
  )
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}
