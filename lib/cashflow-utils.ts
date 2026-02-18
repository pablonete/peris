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
 * The opening balance is the previous balance of the first entry.
 *
 * @param entries - Array of cashflow entries
 * @returns The opening balance, or 0 if no entries exist
 */
export function getCashflowOpeningBalance(entries: CashflowEntry[]): number {
  if (entries.length === 0) {
    return 0
  }

  return getCashflowPreviousBalance(entries[0])
}

/**
 * Calculates the aggregated opening balance across all banks.
 * For each bank, the opening balance is derived from the first entry of that bank
 * (typically an entry without bankSequence). If a bank has no such entry, its
 * initial balance is 0.
 *
 * @param entries - Array of all cashflow entries (not filtered by bank)
 * @returns The sum of opening balances from all banks
 */
export function getCashflowOpeningBalancePerBank(
  entries: CashflowEntry[]
): number {
  if (entries.length === 0) {
    return 0
  }

  // Group entries by bank
  const bankEntries = new Map<string, CashflowEntry[]>()

  for (const entry of entries) {
    const bankName = entry.bankName ?? ""
    if (!bankEntries.has(bankName)) {
      bankEntries.set(bankName, [])
    }
    bankEntries.get(bankName)!.push(entry)
  }

  // Sum opening balance from each bank
  let totalOpening = 0
  for (const entriesForBank of bankEntries.values()) {
    if (entriesForBank.length > 0) {
      totalOpening += getCashflowPreviousBalance(entriesForBank[0])
    }
  }

  return totalOpening
}
