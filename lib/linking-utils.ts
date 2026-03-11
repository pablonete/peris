import { Invoice, Expense, CashflowEntry } from "@/lib/types"

export type LinkedSide = "invoices" | "expenses"

export type LinkingRow = {
  cashflow?: CashflowEntry
  item?: Invoice | Expense
}

function sortCashflowBySequence(entries: CashflowEntry[]): CashflowEntry[] {
  return [...entries].sort((a, b) => {
    if (!a.bankSequence && !b.bankSequence) return 0
    if (!a.bankSequence) return -1
    if (!b.bankSequence) return 1
    return a.bankSequence - b.bankSequence
  })
}

/**
 * Builds rows for the linking view by pairing cashflow entries with their
 * linked invoices or expenses. Cashflow is sorted by bank sequence (carry-overs
 * first), and unlinked items are appended sorted by date.
 */
export function buildLinkingRows(
  cashflow: CashflowEntry[],
  items: (Invoice | Expense)[],
  side: LinkedSide
): LinkingRow[] {
  const sortedCashflow = sortCashflowBySequence(cashflow)
  const usedItemIds = new Set<string>()
  const rows: LinkingRow[] = []

  for (const entry of sortedCashflow) {
    const linkedId = side === "invoices" ? entry.invoiceId : entry.expenseId
    if (linkedId) {
      const item = items.find((i) => i.id === linkedId)
      usedItemIds.add(linkedId)
      rows.push({ cashflow: entry, item })
    } else {
      rows.push({ cashflow: entry })
    }
  }

  const unlinkedItems = items
    .filter((i) => !usedItemIds.has(i.id))
    .sort((a, b) => a.date.localeCompare(b.date))

  for (const item of unlinkedItems) {
    rows.push({ item })
  }

  return rows
}
