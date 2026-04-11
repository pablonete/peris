import type { Expense, Invoice } from "./types"

export interface VatSubtotal {
  rate: number
  count: number
  subtotal: number
  vat: number
  total: number
}

export interface VatQuarterSummary {
  rate: number
  base: number
  quota: number
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100
}

function summarizeVatEntries(
  entries: Array<{ rate: number; base: number; quota: number }>
): VatQuarterSummary[] {
  const summaryMap = new Map<number, { base: number; quota: number }>()

  entries.forEach((entry) => {
    const existing = summaryMap.get(entry.rate) || { base: 0, quota: 0 }

    summaryMap.set(entry.rate, {
      base: roundTwo(existing.base + entry.base),
      quota: roundTwo(existing.quota + entry.quota),
    })
  })

  return Array.from(summaryMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([rate, data]) => ({
      rate,
      base: data.base,
      quota: data.quota,
    }))
}

function getExpenseVatSummaryEntries(expenses: Expense[]) {
  return expenses.flatMap((expense) => {
    if ((expense.vat?.length ?? 0) > 0) {
      return expense.vat!.map((vatItem) => ({
        rate: vatItem.rate,
        base: vatItem.subtotal,
        quota: vatItem.amount,
      }))
    }

    return [
      {
        rate: 0,
        base: expense.total + (expense.taxRetention ?? 0),
        quota: 0,
      },
    ]
  })
}

function resolveInvoiceVatRate(invoice: Invoice) {
  if (typeof invoice.vatRate === "number") {
    return invoice.vatRate
  }

  if (invoice.subtotal === 0 || invoice.vat === 0) {
    return 0
  }

  return roundTwo((invoice.vat / invoice.subtotal) * 100)
}

export function getExpenseVatQuarterSummary(
  expenses: Expense[]
): VatQuarterSummary[] {
  return summarizeVatEntries(getExpenseVatSummaryEntries(expenses))
}

export function getInvoiceVatQuarterSummary(
  invoices: Invoice[]
): VatQuarterSummary[] {
  return summarizeVatEntries(
    invoices.map((invoice) => ({
      rate: resolveInvoiceVatRate(invoice),
      base: invoice.subtotal,
      quota: invoice.vat,
    }))
  )
}

export function getVatSubtotals(expenses: Expense[]): VatSubtotal[] {
  const subtotalsMap = new Map<
    number,
    {
      expenseIds: Set<string>
      subtotal: number
      vat: number
      total: number
    }
  >()

  expenses.forEach((expense) => {
    ;(expense.vat ?? []).forEach((vatItem) => {
      const existing = subtotalsMap.get(vatItem.rate) || {
        expenseIds: new Set<string>(),
        subtotal: 0,
        vat: 0,
        total: 0,
      }

      const itemTotal = vatItem.subtotal + vatItem.amount

      existing.expenseIds.add(expense.id)
      subtotalsMap.set(vatItem.rate, {
        expenseIds: existing.expenseIds,
        subtotal: existing.subtotal + vatItem.subtotal,
        vat: existing.vat + vatItem.amount,
        total: existing.total + itemTotal,
      })
    })
  })

  return Array.from(subtotalsMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([rate, data]) => ({
      rate,
      count: data.expenseIds.size,
      subtotal: data.subtotal,
      vat: data.vat,
      total: data.total,
    }))
}
