import { describe, it, expect } from "vitest"
import { buildLinkingRows } from "@/lib/linking-utils"
import { Invoice, Expense, CashflowEntry } from "@/lib/types"

const invoice1: Invoice = {
  id: "inv-1",
  date: "2025-01-10",
  number: "2025-001",
  client: "Client A",
  concept: "Services",
  subtotal: 1000,
  vat: 210,
  total: 1210,
}

const invoice2: Invoice = {
  id: "inv-2",
  date: "2025-01-20",
  number: "2025-002",
  client: "Client B",
  concept: "Consulting",
  subtotal: 500,
  vat: 105,
  total: 605,
}

const expense1: Expense = {
  id: "exp-1",
  date: "2025-01-05",
  vendor: "Vendor A",
  concept: "Software",
  vat: [{ rate: 21, subtotal: 200, amount: 42 }],
  total: 242,
}

const cashflowWithInvoice: CashflowEntry = {
  id: "cf-1",
  date: "2025-01-12",
  concept: "Payment from Client A",
  bankSequence: 2,
  invoiceId: "inv-1",
  income: 1210,
  balance: 2210,
}

const cashflowWithExpense: CashflowEntry = {
  id: "cf-2",
  date: "2025-01-06",
  concept: "Vendor A payment",
  bankSequence: 1,
  expenseId: "exp-1",
  expense: 242,
  balance: 1000,
}

const cashflowCarryOver: CashflowEntry = {
  id: "cf-carry",
  date: "2025-01-01",
  concept: "Carry over",
  balance: 1000,
}

const cashflowUnlinked: CashflowEntry = {
  id: "cf-3",
  date: "2025-01-15",
  concept: "Misc income",
  bankSequence: 3,
  income: 100,
  balance: 2310,
}

describe("buildLinkingRows", () => {
  it("pairs a cashflow entry with its linked invoice", () => {
    const rows = buildLinkingRows([cashflowWithInvoice], [invoice1], [])
    expect(rows).toHaveLength(1)
    expect(rows[0].cashflow).toBe(cashflowWithInvoice)
    expect(rows[0].item).toBe(invoice1)
    expect(rows[0].itemSide).toBe("invoices")
  })

  it("pairs a cashflow entry with its linked expense", () => {
    const rows = buildLinkingRows([cashflowWithExpense], [], [expense1])
    expect(rows).toHaveLength(1)
    expect(rows[0].cashflow).toBe(cashflowWithExpense)
    expect(rows[0].item).toBe(expense1)
    expect(rows[0].itemSide).toBe("expenses")
  })

  it("sets the date from the cashflow entry", () => {
    const rows = buildLinkingRows([cashflowWithInvoice], [invoice1], [])
    expect(rows[0].date).toBe("2025-01-12")
  })

  it("sets the date from the item when there is no cashflow entry", () => {
    const rows = buildLinkingRows([], [invoice1], [])
    expect(rows[0].date).toBe(invoice1.date)
  })

  it("sorts all rows by date, placing unlinked items at their temporal position", () => {
    // cashflowUnlinked: 2025-01-15, invoice1 (unlinked): 2025-01-10
    const rows = buildLinkingRows([cashflowUnlinked], [invoice1], [])
    expect(rows).toHaveLength(2)
    // invoice1 (2025-01-10) comes before cashflowUnlinked (2025-01-15)
    expect(rows[0].item).toBe(invoice1)
    expect(rows[0].cashflow).toBeUndefined()
    expect(rows[1].cashflow).toBe(cashflowUnlinked)
    expect(rows[1].item).toBeUndefined()
  })

  it("places a paired row before a later unlinked item", () => {
    const rows = buildLinkingRows(
      [cashflowWithInvoice],
      [invoice1, invoice2],
      []
    )
    expect(rows).toHaveLength(2)
    // paired row (cashflow date 2025-01-12) before unlinked invoice2 (2025-01-20)
    expect(rows[0].cashflow).toBe(cashflowWithInvoice)
    expect(rows[0].item).toBe(invoice1)
    expect(rows[1].item).toBe(invoice2)
    expect(rows[1].cashflow).toBeUndefined()
  })

  it("places carry-over entries (earlier date) first", () => {
    const rows = buildLinkingRows(
      [cashflowWithInvoice, cashflowCarryOver],
      [invoice1],
      []
    )
    // cashflowCarryOver: 2025-01-01, cashflowWithInvoice: 2025-01-12
    expect(rows[0].cashflow).toBe(cashflowCarryOver)
    expect(rows[1].cashflow).toBe(cashflowWithInvoice)
  })

  it("sorts rows by date regardless of bankSequence", () => {
    // cashflowWithInvoice: date 2025-01-12, seq 2; cashflowUnlinked: date 2025-01-15, seq 3
    const rows = buildLinkingRows(
      [cashflowUnlinked, cashflowWithInvoice],
      [invoice1],
      []
    )
    expect(rows[0].cashflow?.id).toBe("cf-1") // 2025-01-12
    expect(rows[1].cashflow?.id).toBe("cf-3") // 2025-01-15
  })

  it("returns empty rows for empty inputs", () => {
    expect(buildLinkingRows([], [], [])).toEqual([])
  })

  it("shows invoices and expenses together in a combined list", () => {
    // cashflowWithExpense (2025-01-06) linked to expense1 (2025-01-05)
    // cashflowWithInvoice (2025-01-12) linked to invoice1 (2025-01-10)
    const rows = buildLinkingRows(
      [cashflowWithInvoice, cashflowWithExpense],
      [invoice1],
      [expense1]
    )
    expect(rows).toHaveLength(2)
    expect(rows[0].cashflow).toBe(cashflowWithExpense)
    expect(rows[0].item).toBe(expense1)
    expect(rows[0].itemSide).toBe("expenses")
    expect(rows[1].cashflow).toBe(cashflowWithInvoice)
    expect(rows[1].item).toBe(invoice1)
    expect(rows[1].itemSide).toBe("invoices")
  })

  it("sets itemSide to undefined for unlinked cashflow-only rows", () => {
    const rows = buildLinkingRows([cashflowUnlinked], [], [])
    expect(rows[0].itemSide).toBeUndefined()
  })
})
