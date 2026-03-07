import { CashflowEntry } from "./types"

export function belongsToImportedBank(
  entry: CashflowEntry,
  bankName: string | undefined
): boolean {
  return bankName == null ? !entry.bankName : entry.bankName === bankName
}
