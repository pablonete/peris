import { CashflowEntry } from "./types"

export type CategoryGroupMode = "first-level" | "full"

export interface CategoryTotal {
  category: string
  total: number
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
 * Aggregates cashflow expense entries by category.
 * Entries without a category use an empty string key.
 * Categorised entries are sorted by total descending; the no-category group is last.
 *
 * @param entries - Array of cashflow entries
 * @param mode - "first-level" groups by the segment before the first dot; "full" keeps the literal name
 * @returns Sorted array of category totals
 */
export function getCashflowExpenseTotalsByCategory(
  entries: CashflowEntry[],
  mode: CategoryGroupMode
): CategoryTotal[] {
  const totals = new Map<string, number>()

  for (const entry of entries) {
    if (!entry.expense) continue
    const key = resolveCategoryKey(entry.category, mode)
    totals.set(key, (totals.get(key) ?? 0) + entry.expense)
  }

  const result = Array.from(totals.entries()).map(([category, total]) => ({
    category,
    total,
  }))

  const withCategory = result
    .filter((r) => r.category !== "")
    .sort((a, b) => b.total - a.total)
  const withoutCategory = result.filter((r) => r.category === "")

  return [...withCategory, ...withoutCategory]
}

function resolveCategoryKey(
  category: string | undefined,
  mode: CategoryGroupMode
): string {
  if (!category) return ""
  return mode === "first-level" ? category.split(".")[0] : category
}
