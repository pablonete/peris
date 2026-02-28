import { CashflowEntry } from "./types"
import {
  parseEntryDate,
  formatDateISO,
  addMonths,
  addYears,
  addDays,
} from "./date-utils"
import { getPreviousQuarterId, getYearAgoQuarterId } from "./quarter-utils"

export type GhostCashflowEntry = CashflowEntry & {
  isGhost: true
  originalEntry: CashflowEntry
  originalQuarterId: string
}

export function isGhostEntry(
  entry: CashflowEntry | GhostCashflowEntry
): entry is GhostCashflowEntry {
  return "isGhost" in entry && (entry as GhostCashflowEntry).isGhost === true
}

interface QuarterInfo {
  quarterId: string
  previousQuarterId: string
  yearAgoQuarterId: string
  quarterEnd: Date
  quarterStart: Date
}

function parseQuarterId(quarterId: string): { year: number; quarter: number } {
  const match = quarterId.match(/^(\d{4})\.(\d)Q$/)
  if (!match) return { year: 0, quarter: 0 }
  return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) }
}

function getQuarterStart(year: number, quarter: number): Date {
  return new Date(year, (quarter - 1) * 3, 1)
}

function getQuarterEnd(year: number, quarter: number): Date {
  return new Date(year, quarter * 3, 0)
}

function makeGhostEntry(
  originalEntry: CashflowEntry,
  date: Date,
  originalQuarterId: string
): GhostCashflowEntry {
  return {
    ...originalEntry,
    id: `ghost-${originalEntry.id}-${formatDateISO(date)}`,
    date: formatDateISO(date),
    balance: 0,
    invoiceId: undefined,
    expenseId: undefined,
    bankSequence: undefined,
    isGhost: true,
    originalEntry,
    originalQuarterId,
  }
}

function assignGhostBalances(
  ghosts: GhostCashflowEntry[],
  lastBalance: number
): void {
  let balance = lastBalance
  for (const ghost of ghosts) {
    balance += (ghost.income ?? 0) - (ghost.expense ?? 0)
    ghost.balance = balance
  }
}

function generateGhostEntriesForBank(
  currentEntries: CashflowEntry[],
  previousEntries: CashflowEntry[],
  yearAgoEntries: CashflowEntry[],
  quarterInfo: QuarterInfo
): GhostCashflowEntry[] {
  const {
    quarterId,
    previousQuarterId,
    yearAgoQuarterId,
    quarterEnd,
    quarterStart,
  } = quarterInfo

  const realEntries = currentEntries.filter(
    (e) => e.concept !== "Carry over" && (e.income != null || e.expense != null)
  )

  const lastEntryDate =
    realEntries.length > 0
      ? parseEntryDate(realEntries[realEntries.length - 1].date)
      : addDays(quarterStart, -1)

  const thirtyDaysBeforeLast = addDays(lastEntryDate, -30)
  const source1mo: Array<{ entry: CashflowEntry; sourceQuarterId: string }> = [
    ...currentEntries
      .filter(
        (e) =>
          e.periodicity === "1mo" &&
          parseEntryDate(e.date) > thirtyDaysBeforeLast
      )
      .map((entry) => ({ entry, sourceQuarterId: quarterId })),
    ...previousEntries
      .filter(
        (e) =>
          e.periodicity === "1mo" &&
          parseEntryDate(e.date) > thirtyDaysBeforeLast
      )
      .map((entry) => ({ entry, sourceQuarterId: previousQuarterId })),
  ]

  const threeMonthsBefore = addMonths(lastEntryDate, -3)
  const source3mo = previousEntries
    .filter(
      (e) =>
        e.periodicity === "3mo" && parseEntryDate(e.date) > threeMonthsBefore
    )
    .map((entry) => ({ entry, sourceQuarterId: previousQuarterId }))

  const oneYearBefore = addYears(lastEntryDate, -1)
  const source1y = yearAgoEntries
    .filter(
      (e) => e.periodicity === "1y" && parseEntryDate(e.date) > oneYearBefore
    )
    .map((entry) => ({ entry, sourceQuarterId: yearAgoQuarterId }))

  const ghosts: GhostCashflowEntry[] = []

  for (const { entry, sourceQuarterId } of source1mo) {
    const sourceDate = parseEntryDate(entry.date)
    for (let i = 1; i <= 3; i++) {
      const ghostDate = addMonths(sourceDate, i)
      if (ghostDate <= lastEntryDate) continue
      if (ghostDate > quarterEnd) break
      ghosts.push(makeGhostEntry(entry, ghostDate, sourceQuarterId))
    }
  }

  for (const { entry, sourceQuarterId } of source3mo) {
    const ghostDate = addMonths(parseEntryDate(entry.date), 3)
    if (ghostDate > lastEntryDate && ghostDate <= quarterEnd) {
      ghosts.push(makeGhostEntry(entry, ghostDate, sourceQuarterId))
    }
  }

  for (const { entry, sourceQuarterId } of source1y) {
    const ghostDate = addYears(parseEntryDate(entry.date), 1)
    if (ghostDate > lastEntryDate && ghostDate <= quarterEnd) {
      ghosts.push(makeGhostEntry(entry, ghostDate, sourceQuarterId))
    }
  }

  ghosts.sort((a, b) => a.date.localeCompare(b.date))
  const lastBalance =
    currentEntries.length > 0
      ? currentEntries[currentEntries.length - 1].balance
      : 0
  assignGhostBalances(ghosts, lastBalance)

  return ghosts
}

/**
 * Generates ghost (forecast) entries for a quarter based on periodic source entries.
 * Results are grouped by bank (sorted within each bank by date).
 */
export function generateGhostEntries(
  currentEntries: CashflowEntry[],
  previousEntries: CashflowEntry[] | null | undefined = [],
  yearAgoEntries: CashflowEntry[] | null | undefined = [],
  quarterId: string
): GhostCashflowEntry[] {
  const { year, quarter } = parseQuarterId(quarterId)
  if (!year) return []

  const prevEntries = previousEntries ?? []
  const yearEntries = yearAgoEntries ?? []
  const quarterInfo: QuarterInfo = {
    quarterId,
    previousQuarterId: getPreviousQuarterId(quarterId),
    yearAgoQuarterId: getYearAgoQuarterId(quarterId),
    quarterEnd: getQuarterEnd(year, quarter),
    quarterStart: getQuarterStart(year, quarter),
  }

  const allBankKeys = Array.from(
    new Set(
      [...currentEntries, ...prevEntries, ...yearEntries].map(
        (e) => e.bankName ?? ""
      )
    )
  )

  const allGhosts: GhostCashflowEntry[] = []

  for (const bankKey of allBankKeys) {
    const bankGhosts = generateGhostEntriesForBank(
      currentEntries.filter((e) => (e.bankName ?? "") === bankKey),
      prevEntries.filter((e) => (e.bankName ?? "") === bankKey),
      yearEntries.filter((e) => (e.bankName ?? "") === bankKey),
      quarterInfo
    )
    allGhosts.push(...bankGhosts)
  }

  return allGhosts
}
