import { describe, it, expect } from "vitest"
import { getVatSubtotals } from "@/lib/vat-subtotals"
import type { Expense } from "@/lib/types"

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
          concept: "Test",
          vat: [{ rate: 21, subtotal: 100, amount: 21 }],
          irpf: 0,
          total: 121,
        },
        {
          id: "EXP-2",
          date: "2024-01-02",
          concept: "Test 2",
          vat: [{ rate: 21, subtotal: 200, amount: 42 }],
          irpf: 0,
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
          concept: "Test",
          vat: [{ rate: 21, subtotal: 100, amount: 21 }],
          irpf: 0,
          total: 121,
        },
        {
          id: "EXP-2",
          date: "2024-01-02",
          concept: "Test 2",
          vat: [{ rate: 10, subtotal: 200, amount: 20 }],
          irpf: 0,
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
          concept: "Test",
          vat: [
            { rate: 4, subtotal: 50, amount: 2 },
            { rate: 21, subtotal: 100, amount: 21 },
            { rate: 10, subtotal: 200, amount: 20 },
          ],
          irpf: 0,
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
          concept: "Test",
          vat: [
            { rate: 21, subtotal: 100, amount: 21 },
            { rate: 21, subtotal: 50, amount: 10.5 },
          ],
          irpf: 0,
          total: 181.5,
        },
      ]

      const result = getVatSubtotals(expenses)

      expect(result[0].count).toBe(1)
    })
  })
})
