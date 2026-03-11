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
    const rows = buildLinkingRows([cashflowWithInvoice], [invoice1], "invoices")
    expect(rows).toHaveLength(1)
    expect(rows[0].cashflow).toBe(cashflowWithInvoice)
    expect(rows[0].item).toBe(invoice1)
  })

  it("pairs a cashflow entry with its linked expense", () => {
    const rows = buildLinkingRows([cashflowWithExpense], [expense1], "expenses")
    expect(rows).toHaveLength(1)
    expect(rows[0].cashflow).toBe(cashflowWithExpense)
    expect(rows[0].item).toBe(expense1)
  })

  it("creates a cashflow-only row when there is no linked item", () => {
    const rows = buildLinkingRows([cashflowUnlinked], [invoice1], "invoices")
    expect(rows).toHaveLength(2)
    expect(rows[0].cashflow).toBe(cashflowUnlinked)
    expect(rows[0].item).toBeUndefined()
    // unlinked invoice appended at the end
    expect(rows[1].item).toBe(invoice1)
    expect(rows[1].cashflow).toBeUndefined()
  })

  it("creates an item-only row for unlinked items after cashflow rows", () => {
    const rows = buildLinkingRows(
      [cashflowWithInvoice],
      [invoice1, invoice2],
      "invoices"
    )
    expect(rows).toHaveLength(2)
    // paired row first
    expect(rows[0].cashflow).toBe(cashflowWithInvoice)
    expect(rows[0].item).toBe(invoice1)
    // unlinked invoice after
    expect(rows[1].cashflow).toBeUndefined()
    expect(rows[1].item).toBe(invoice2)
  })

  it("sorts unlinked items by date", () => {
    const rows = buildLinkingRows([], [invoice2, invoice1], "invoices")
    expect(rows[0].item).toBe(invoice1) // date 2025-01-10 comes before 2025-01-20
    expect(rows[1].item).toBe(invoice2)
  })

  it("places carry-over entries (no bankSequence) first", () => {
    const rows = buildLinkingRows(
      [cashflowWithInvoice, cashflowCarryOver],
      [invoice1],
      "invoices"
    )
    expect(rows[0].cashflow).toBe(cashflowCarryOver)
    expect(rows[1].cashflow).toBe(cashflowWithInvoice)
  })

  it("sorts cashflow entries by bankSequence", () => {
    const rows = buildLinkingRows(
      [cashflowUnlinked, cashflowWithInvoice],
      [invoice1],
      "invoices"
    )
    // cashflowWithInvoice has bankSequence 2, cashflowUnlinked has 3
    expect(rows[0].cashflow?.id).toBe("cf-1")
    expect(rows[1].cashflow?.id).toBe("cf-3")
  })

  it("returns empty rows for empty inputs", () => {
    expect(buildLinkingRows([], [], "invoices")).toEqual([])
    expect(buildLinkingRows([], [], "expenses")).toEqual([])
  })

  it("does not include invoiceId-linked items when side is expenses", () => {
    const rows = buildLinkingRows([cashflowWithInvoice], [expense1], "expenses")
    // cashflowWithInvoice has invoiceId not expenseId, so no pairing
    expect(rows[0].cashflow).toBe(cashflowWithInvoice)
    expect(rows[0].item).toBeUndefined()
    // expense1 is unlinked
    expect(rows[1].item).toBe(expense1)
  })
})
