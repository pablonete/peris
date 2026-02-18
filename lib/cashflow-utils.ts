import { CashflowEntry } from "./types"

/**
 * Calculates the previous balance (opening balance) from cashflow entries.
 * The opening balance is derived from the first entry by subtracting its income
 * and adding back its expense to get the balance before that transaction.
 *
 * @param entries - Array of cashflow entries
 * @returns The opening balance, or 0 if no entries exist
 */
export function getCashflowPreviousBalance(entries: CashflowEntry[]): number {
  if (entries.length === 0) {
    return 0
  }

  const firstEntry = entries[0]
  return (
    firstEntry.balance - (firstEntry.income ?? 0) + (firstEntry.expense ?? 0)
  )
}
