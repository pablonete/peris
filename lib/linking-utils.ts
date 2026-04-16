import { Invoice, Expense, CashflowEntry } from "@/lib/types"

export type LinkedItemType = "invoices" | "expenses"

const QUARTER_SCOPED_LINK_ID_PATTERN = /^\[(\d{4}\.\dQ)\](.+)$/

export type LinkingRow = {
  /** Date used for ordering: cashflow date if present, otherwise the item date. */
  date: string
  cashflow?: CashflowEntry
  item?: Invoice | Expense
  /** Whether the item is an invoice or expense. */
  itemType?: LinkedItemType
}

export function getRawLinkedItemId(itemId: string): string {
  const match = itemId.match(QUARTER_SCOPED_LINK_ID_PATTERN)
  return match?.[2] ?? itemId
}

/**
 * Builds the stored link identifier for a cross-quarter cashflow link by
 * prefixing the original item ID with the cashflow quarter.
 */
export function makeQuarterScopedLinkId(
  quarterId: string,
  itemId: string
): string {
  return `[${quarterId}]${itemId}`
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
      const linkedInvoiceId = getRawLinkedItemId(entry.invoiceId)
      const item = invoices.find((i) => i.id === linkedInvoiceId)
      if (item) usedInvoiceIds.add(item.id)
      rows.push({
        date: entry.date,
        cashflow: entry,
        item,
        itemType: "invoices",
      })
    } else if (entry.expenseId) {
      const linkedExpenseId = getRawLinkedItemId(entry.expenseId)
      const item = expenses.find((e) => e.id === linkedExpenseId)
      if (item) usedExpenseIds.add(item.id)
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
