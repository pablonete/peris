import { CashflowEntry } from "./types"

export type CategoryGroupMode = "first-level" | "full"

export type GhostCashflowEntry = CashflowEntry & { isGhost: true }

export interface CategoryTotal {
  category: string
  invoicesTotal: number
  expensesTotal: number
}

const BANK_COLORS = ["blue", "green", "red"] as const
type BankColor = (typeof BANK_COLORS)[number]

/**
 * Calculates the previous balance from a single cashflow entry.
 * The previous balance is derived by subtracting the entry's income
 * and adding back its expense to get the balance before that transaction.
 *
 * @param entry - A single cashflow entry
 * @returns The balance before this entry's transaction
 */
export function getCashflowPreviousBalance(entry: CashflowEntry): number {
  return entry.balance - (entry.income ?? 0) + (entry.expense ?? 0)
}

/**
 * Calculates the opening balance from cashflow entries.
 * Groups entries by bank and sums the opening balance from each bank's first entry.
 *
 * @param entries - Array of cashflow entries
 * @returns The opening balance, or 0 if no entries exist
 */
export function getCashflowOpeningBalance(entries: CashflowEntry[]): number {
  if (entries.length === 0) {
    return 0
  }

  const seenBanks = new Set<string>()
  let totalOpening = 0

  for (const entry of entries) {
    const bankName = entry.bankName ?? ""
    if (!seenBanks.has(bankName)) {
      seenBanks.add(bankName)
      totalOpening += getCashflowPreviousBalance(entry)
    }
  }

  return totalOpening
}

/**
 * Calculates the closing balance from cashflow entries.
 * Groups entries by bank and sums the closing balance from each bank's last entry.
 *
 * @param entries - Array of cashflow entries
 * @returns The closing balance, or 0 if no entries exist
 */
export function getCashflowClosingBalance(entries: CashflowEntry[]): number {
  if (entries.length === 0) {
    return 0
  }

  const lastEntryPerBank = new Map<string, CashflowEntry>()

  for (const entry of entries) {
    const bankName = entry.bankName ?? ""
    lastEntryPerBank.set(bankName, entry)
  }

  let totalClosing = 0
  for (const entry of lastEntryPerBank.values()) {
    totalClosing += entry.balance
  }

  return totalClosing
}

/**
 * Assigns a color to a bank based on its alphabetical position.
 * Banks are sorted alphabetically and assigned colors in order: Blue, Green, Red (repeating).
 *
 * @param bankName - The name of the bank
 * @param sortedBanks - Array of all bank names sorted alphabetically
 * @returns The color assigned to this bank
 */
export function getBankColor(
  bankName: string,
  sortedBanks: string[]
): BankColor {
  const index = sortedBanks.indexOf(bankName)
  if (index === -1) {
    return "blue"
  }
  return BANK_COLORS[index % BANK_COLORS.length]
}

/**
 * Returns the Tailwind CSS class for the bank color indicator square.
 *
 * @param bankName - The name of the bank
 * @param sortedBanks - Array of all bank names sorted alphabetically
 * @returns Tailwind class string for the colored square
 */
export function getBankColorClass(
  bankName: string,
  sortedBanks: string[]
): string {
  const color = getBankColor(bankName, sortedBanks)
  switch (color) {
    case "blue":
      return "bg-[hsl(var(--ledger-blue))]"
    case "green":
      return "bg-[hsl(var(--ledger-green))]"
    case "red":
      return "bg-[hsl(var(--ledger-red))]"
  }
}

/**
 * Aggregates cashflow entries by category, summing both income and expense totals.
 * Entries without a category use an empty string key.
 * Results are sorted by expensesTotal descending.
 *
 * @param entries - Array of cashflow entries
 * @param mode - "first-level" groups by the segment before the first dot; "full" keeps the literal name
 * @returns Sorted array of category totals
 */
export function getCashflowTotalsByCategory(
  entries: CashflowEntry[],
  mode: CategoryGroupMode
): CategoryTotal[] {
  const expenses = new Map<string, number>()
  const incomes = new Map<string, number>()

  for (const entry of entries) {
    const key = resolveCategoryKey(entry.category, mode)
    if (entry.expense) {
      expenses.set(key, (expenses.get(key) ?? 0) + entry.expense)
    }
    if (entry.income) {
      incomes.set(key, (incomes.get(key) ?? 0) + entry.income)
    }
  }

  const allKeys = new Set([...expenses.keys(), ...incomes.keys()])

  return Array.from(allKeys)
    .map((category) => ({
      category,
      invoicesTotal: incomes.get(category) ?? 0,
      expensesTotal: expenses.get(category) ?? 0,
    }))
    .sort((a, b) => b.expensesTotal - a.expensesTotal)
}

function resolveCategoryKey(
  category: string | undefined,
  mode: CategoryGroupMode
): string {
  if (!category) return ""
  return mode === "first-level" ? category.split(".")[0] : category
}

function parseQuarterId(quarterId: string): { year: number; quarter: number } {
  const match = quarterId.match(/^(\d{4})\.(\d)Q$/)
  if (!match) return { year: 0, quarter: 0 }
  return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) }
}

function getQuarterEnd(year: number, quarter: number): Date {
  const endMonth = quarter * 3
  return new Date(year, endMonth, 0)
}

function parseEntryDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00")
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function makeGhostEntry(source: CashflowEntry, date: Date): GhostCashflowEntry {
  return {
    ...source,
    id: `ghost-${source.id}-${formatDateISO(date)}`,
    date: formatDateISO(date),
    balance: 0,
    invoiceId: undefined,
    expenseId: undefined,
    bankSequence: undefined,
    isGhost: true,
  }
}

/**
 * Generates ghost (forecast) entries for a quarter based on periodic source entries.
 *
 * Ghost entries are derived from:
 * - `1mo` entries within 30 days before the last real entry (from current or previous quarter)
 * - `3mo` entries from the previous quarter within 3 months before the last entry
 * - `1y` entries from the year-ago same quarter within 1 year before the last entry
 *
 * Only ghosts strictly after the last real entry date and within the current quarter are returned.
 */
export function generateGhostEntries(
  currentEntries: CashflowEntry[],
  previousEntries: CashflowEntry[],
  yearAgoEntries: CashflowEntry[],
  quarterId: string
): GhostCashflowEntry[] {
  const { year, quarter } = parseQuarterId(quarterId)
  if (!year) return []

  const quarterEnd = getQuarterEnd(year, quarter)

  const realEntries = currentEntries.filter(
    (e) => e.concept !== "Carry over" && (e.income != null || e.expense != null)
  )
  if (realEntries.length === 0) return []

  const lastEntryDate = parseEntryDate(realEntries[realEntries.length - 1].date)

  const thirtyDaysBeforeLast = addDays(lastEntryDate, -30)
  const source1mo: CashflowEntry[] = [
    ...currentEntries.filter(
      (e) =>
        e.periodicity === "1mo" && parseEntryDate(e.date) > thirtyDaysBeforeLast
    ),
    ...previousEntries.filter(
      (e) =>
        e.periodicity === "1mo" && parseEntryDate(e.date) > thirtyDaysBeforeLast
    ),
  ]

  const threeMonthsBefore = addMonths(lastEntryDate, -3)
  const source3mo = previousEntries.filter(
    (e) => e.periodicity === "3mo" && parseEntryDate(e.date) > threeMonthsBefore
  )

  const oneYearBefore = addYears(lastEntryDate, -1)
  const source1y = yearAgoEntries.filter(
    (e) => e.periodicity === "1y" && parseEntryDate(e.date) > oneYearBefore
  )

  const ghosts: GhostCashflowEntry[] = []

  for (const source of source1mo) {
    const sourceDate = parseEntryDate(source.date)
    for (let i = 1; i <= 3; i++) {
      const ghostDate = addMonths(sourceDate, i)
      if (ghostDate <= lastEntryDate) continue
      if (ghostDate > quarterEnd) break
      ghosts.push(makeGhostEntry(source, ghostDate))
    }
  }

  for (const source of source3mo) {
    const ghostDate = addMonths(parseEntryDate(source.date), 3)
    if (ghostDate > lastEntryDate && ghostDate <= quarterEnd) {
      ghosts.push(makeGhostEntry(source, ghostDate))
    }
  }

  for (const source of source1y) {
    const ghostDate = addYears(parseEntryDate(source.date), 1)
    if (ghostDate > lastEntryDate && ghostDate <= quarterEnd) {
      ghosts.push(makeGhostEntry(source, ghostDate))
    }
  }

  return ghosts.sort((a, b) => a.date.localeCompare(b.date))
}
