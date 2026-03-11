import { Invoice, Expense, CashflowEntry } from "@/lib/types"

export type LinkedItemType = "invoices" | "expenses"

export type LinkingRow = {
  /** Date used for ordering: cashflow date if present, otherwise the item date. */
  date: string
  cashflow?: CashflowEntry
  item?: Invoice | Expense
  /** Whether the item is an invoice or expense. */
  itemType?: LinkedItemType
}

/**
 * Builds rows for the linking view by pairing cashflow entries with their
 * linked invoices or expenses (both kinds at once). Each row gets a date
 * (cashflow date if present, otherwise item date), and all rows are sorted by
 * that date so unlinked items appear at their temporal position rather than
 * appended at the end.
 */
export function buildLinkingRows(
  cashflow: CashflowEntry[],
  invoices: Invoice[],
  expenses: Expense[]
): LinkingRow[] {
  const usedInvoiceIds = new Set<string>()
  const usedExpenseIds = new Set<string>()
  const rows: LinkingRow[] = []

  for (const entry of cashflow) {
    if (entry.invoiceId) {
      const item = invoices.find((i) => i.id === entry.invoiceId)
      if (item) usedInvoiceIds.add(entry.invoiceId)
      rows.push({
        date: entry.date,
        cashflow: entry,
        item,
        itemType: "invoices",
      })
    } else if (entry.expenseId) {
      const item = expenses.find((e) => e.id === entry.expenseId)
      if (item) usedExpenseIds.add(entry.expenseId)
      rows.push({
        date: entry.date,
        cashflow: entry,
        item,
        itemType: "expenses",
      })
    } else {
      rows.push({ date: entry.date, cashflow: entry })
    }
  }

  for (const item of invoices.filter((i) => !usedInvoiceIds.has(i.id))) {
    rows.push({ date: item.date, item, itemType: "invoices" })
  }

  for (const item of expenses.filter((e) => !usedExpenseIds.has(e.id))) {
    rows.push({ date: item.date, item, itemType: "expenses" })
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date))
}
