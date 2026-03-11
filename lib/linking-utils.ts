import { Invoice, Expense, CashflowEntry } from "@/lib/types"

export type LinkedSide = "invoices" | "expenses"

export type LinkingRow = {
  /** Date used for ordering: cashflow date if present, otherwise the item date. */
  date: string
  cashflow?: CashflowEntry
  item?: Invoice | Expense
}

/**
 * Builds rows for the linking view by pairing cashflow entries with their
 * linked invoices or expenses. Each row gets a date (cashflow date if present,
 * otherwise item date), and all rows are sorted by that date so unlinked items
 * appear at their temporal position rather than appended at the end.
 */
export function buildLinkingRows(
  cashflow: CashflowEntry[],
  items: (Invoice | Expense)[],
  side: LinkedSide
): LinkingRow[] {
  const usedItemIds = new Set<string>()
  const rows: LinkingRow[] = []

  for (const entry of cashflow) {
    const linkedId = side === "invoices" ? entry.invoiceId : entry.expenseId
    if (linkedId) {
      const item = items.find((i) => i.id === linkedId)
      if (item) usedItemIds.add(linkedId)
      rows.push({ date: entry.date, cashflow: entry, item })
    } else {
      rows.push({ date: entry.date, cashflow: entry })
    }
  }

  for (const item of items.filter((i) => !usedItemIds.has(i.id))) {
    rows.push({ date: item.date, item })
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date))
}
