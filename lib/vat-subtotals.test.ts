import { describe, it, expect } from "vitest"
import {
  getExpenseVatQuarterSummary,
  getInvoiceVatQuarterSummary,
  getVatSubtotals,
} from "@/lib/vat-subtotals"
import type { Expense, Invoice } from "@/lib/types"

describe("vat-subtotals", () => {
  describe("getVatSubtotals", () => {
    it("should return empty array for no expenses", () => {
      const result = getVatSubtotals([])
      expect(result).toEqual([])
    })

    it("should calculate subtotals for single VAT rate", () => {
      const expenses: Expense[] = [
        {
          id: "EXP-1",
          date: "2024-01-01",
          vendor: "",
          concept: "Test",
          vat: [{ rate: 21, subtotal: 100, amount: 21 }],
          total: 121,
        },
        {
          id: "EXP-2",
          date: "2024-01-02",
          vendor: "",
          concept: "Test 2",
          vat: [{ rate: 21, subtotal: 200, amount: 42 }],
          total: 242,
        },
      ]

      const result = getVatSubtotals(expenses)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        rate: 21,
        count: 2,
        subtotal: 300,
        vat: 63,
        total: 363,
      })
    })

    it("should calculate subtotals for multiple VAT rates", () => {
      const expenses: Expense[] = [
        {
          id: "EXP-1",
          date: "2024-01-01",
          vendor: "",
          concept: "Test",
          vat: [{ rate: 21, subtotal: 100, amount: 21 }],
          total: 121,
        },
        {
          id: "EXP-2",
          date: "2024-01-02",
          vendor: "",
          concept: "Test 2",
          vat: [{ rate: 10, subtotal: 200, amount: 20 }],
          total: 220,
        },
      ]

      const result = getVatSubtotals(expenses)

      expect(result).toHaveLength(2)
      expect(result[0].rate).toBe(21)
      expect(result[1].rate).toBe(10)
    })

    it("should sort rates in descending order", () => {
      const expenses: Expense[] = [
        {
          id: "EXP-1",
          date: "2024-01-01",
          vendor: "",
          concept: "Test",
          vat: [
            { rate: 4, subtotal: 50, amount: 2 },
            { rate: 21, subtotal: 100, amount: 21 },
            { rate: 10, subtotal: 200, amount: 20 },
          ],
          total: 393,
        },
      ]

      const result = getVatSubtotals(expenses)

      expect(result.map((r) => r.rate)).toEqual([21, 10, 4])
    })

    it("should count unique expenses per rate", () => {
      const expenses: Expense[] = [
        {
          id: "EXP-1",
          date: "2024-01-01",
          vendor: "",
          concept: "Test",
          vat: [
            { rate: 21, subtotal: 100, amount: 21 },
            { rate: 21, subtotal: 50, amount: 10.5 },
          ],
          total: 181.5,
        },
      ]

      const result = getVatSubtotals(expenses)

      expect(result[0].count).toBe(1)
    })
  })

  describe("getExpenseVatQuarterSummary", () => {
    it("groups expense VAT by rate, including expenses without VAT", () => {
      const expenses: Expense[] = [
        {
          id: "EXP-1",
          date: "2024-01-01",
          vendor: "",
          concept: "Standard VAT",
          vat: [{ rate: 21, subtotal: 100, amount: 21 }],
          total: 121,
        },
        {
          id: "EXP-2",
          date: "2024-01-02",
          vendor: "",
          concept: "Reduced VAT",
          vat: [{ rate: 10, subtotal: 200, amount: 20 }],
          total: 220,
        },
        {
          id: "EXP-3",
          date: "2024-01-03",
          vendor: "",
          concept: "No VAT",
          total: 50,
          taxRetention: 10,
        },
      ]

      expect(getExpenseVatQuarterSummary(expenses)).toEqual([
        { rate: 21, base: 100, quota: 21 },
        { rate: 10, base: 200, quota: 20 },
        { rate: 0, base: 60, quota: 0 },
      ])
    })
  })

  describe("getInvoiceVatQuarterSummary", () => {
    it("groups invoice VAT by rate and derives the rate when it is missing", () => {
      const invoices: Invoice[] = [
        {
          id: "INV-1",
          date: "2024-01-01",
          number: "1",
          client: "",
          concept: "Standard VAT",
          subtotal: 100,
          vatRate: 21,
          vat: 21,
          total: 121,
        },
        {
          id: "INV-2",
          date: "2024-01-02",
          number: "2",
          client: "",
          concept: "Reduced VAT",
          subtotal: 50,
          vat: 5,
          total: 55,
        },
        {
          id: "INV-3",
          date: "2024-01-03",
          number: "3",
          client: "",
          concept: "No VAT",
          subtotal: 25,
          vat: 0,
          total: 25,
        },
      ]

      expect(getInvoiceVatQuarterSummary(invoices)).toEqual([
        { rate: 21, base: 100, quota: 21 },
        { rate: 10, base: 50, quota: 5 },
        { rate: 0, base: 25, quota: 0 },
      ])
    })
  })
})
