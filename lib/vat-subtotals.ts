import { Expense } from "./types"

export interface VatSubtotal {
  rate: number
  count: number
  subtotal: number
  vat: number
  total: number
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
    expense.vat.forEach((vatItem) => {
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
