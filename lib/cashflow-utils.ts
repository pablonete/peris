import { CashflowEntry } from "./types"

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

  const bankEntries = new Map<string, CashflowEntry[]>()

  for (const entry of entries) {
    const bankName = entry.bankName ?? ""
    if (!bankEntries.has(bankName)) {
      bankEntries.set(bankName, [])
    }
    bankEntries.get(bankName)!.push(entry)
  }

  let totalOpening = 0
  for (const entriesForBank of bankEntries.values()) {
    if (entriesForBank.length > 0) {
      totalOpening += getCashflowPreviousBalance(entriesForBank[0])
    }
  }

  return totalOpening
}
