import { CashflowEntry } from "./types"
import {
  parseEntryDate,
  formatDateISO,
  addMonths,
  addYears,
  addDays,
} from "./date-utils"

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

export function getPreviousQuarterId(quarterId: string): string {
  const match = quarterId.match(/^(\d{4})\.(\d)Q$/)
  if (!match) return quarterId
  const year = parseInt(match[1], 10)
  const quarter = parseInt(match[2], 10)
  if (quarter === 1) return `${year - 1}.4Q`
  return `${year}.${quarter - 1}Q`
}

export function getYearAgoQuarterId(quarterId: string): string {
  const match = quarterId.match(/^(\d{4})\.(\d)Q$/)
  if (!match) return quarterId
  return `${parseInt(match[1], 10) - 1}.${match[2]}Q`
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

function generateGhostEntriesForBank(
  bankKey: string,
  currentEntries: CashflowEntry[],
  previousEntries: CashflowEntry[],
  yearAgoEntries: CashflowEntry[],
  currentQuarterId: string,
  previousQuarterId: string,
  yearAgoQuarterId: string,
  quarterEnd: Date,
  quarterStart: Date
): GhostCashflowEntry[] {
  const bankCurrentEntries = currentEntries.filter(
    (e) => (e.bankName ?? "") === bankKey
  )
  const bankPreviousEntries = previousEntries.filter(
    (e) => (e.bankName ?? "") === bankKey
  )
  const bankYearAgoEntries = yearAgoEntries.filter(
    (e) => (e.bankName ?? "") === bankKey
  )

  const realEntries = bankCurrentEntries.filter(
    (e) => e.concept !== "Carry over" && (e.income != null || e.expense != null)
  )

  const lastEntryDate =
    realEntries.length > 0
      ? parseEntryDate(realEntries[realEntries.length - 1].date)
      : addDays(quarterStart, -1)
  const thirtyDaysBeforeLast = addDays(lastEntryDate, -30)
  const source1mo: Array<{ entry: CashflowEntry; sourceQuarterId: string }> = [
    ...bankCurrentEntries
      .filter(
        (e) =>
          e.periodicity === "1mo" &&
          parseEntryDate(e.date) > thirtyDaysBeforeLast
      )
      .map((entry) => ({ entry, sourceQuarterId: currentQuarterId })),
    ...bankPreviousEntries
      .filter(
        (e) =>
          e.periodicity === "1mo" &&
          parseEntryDate(e.date) > thirtyDaysBeforeLast
      )
      .map((entry) => ({ entry, sourceQuarterId: previousQuarterId })),
  ]

  const threeMonthsBefore = addMonths(lastEntryDate, -3)
  const source3mo = bankPreviousEntries
    .filter(
      (e) =>
        e.periodicity === "3mo" && parseEntryDate(e.date) > threeMonthsBefore
    )
    .map((entry) => ({ entry, sourceQuarterId: previousQuarterId }))

  const oneYearBefore = addYears(lastEntryDate, -1)
  const source1y = bankYearAgoEntries
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

  return ghosts
}

function assignGhostBalances(
  ghosts: GhostCashflowEntry[],
  currentEntries: CashflowEntry[]
): void {
  const bankBalances = new Map<string, number>()
  for (const entry of currentEntries) {
    bankBalances.set(entry.bankName ?? "", entry.balance)
  }
  for (const ghost of ghosts) {
    const bankKey = ghost.bankName ?? ""
    const prev = bankBalances.get(bankKey) ?? 0
    const next = prev + (ghost.income ?? 0) - (ghost.expense ?? 0)
    ghost.balance = next
    bankBalances.set(bankKey, next)
  }
}

/**
 * Generates ghost (forecast) entries for a quarter based on periodic source entries.
 * Results are sorted by date with balances assigned incrementally per bank.
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
  const previousQuarterId = getPreviousQuarterId(quarterId)
  const yearAgoQuarterId = getYearAgoQuarterId(quarterId)
  const quarterEnd = getQuarterEnd(year, quarter)
  const quarterStart = getQuarterStart(year, quarter)

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
      bankKey,
      currentEntries,
      prevEntries,
      yearEntries,
      quarterId,
      previousQuarterId,
      yearAgoQuarterId,
      quarterEnd,
      quarterStart
    )
    allGhosts.push(...bankGhosts)
  }

  allGhosts.sort((a, b) => a.date.localeCompare(b.date))
  assignGhostBalances(allGhosts, currentEntries)

  return allGhosts
}
