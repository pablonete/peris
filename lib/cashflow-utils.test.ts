import { describe, it, expect } from "vitest"
import {
  getCashflowPreviousBalance,
  getCashflowOpeningBalance,
} from "./cashflow-utils"
import { CashflowEntry } from "./types"

describe("cashflow-utils", () => {
  describe("getCashflowPreviousBalance", () => {
    it("should calculate previous balance for income entry", () => {
      const entry: CashflowEntry = {
        id: "1",
        date: "2025-01-15",
        concept: "Invoice payment",
        balance: 6210,
        income: 1210,
      }
      const result = getCashflowPreviousBalance(entry)
      expect(result).toBe(5000) // 6210 - 1210 + 0
    })

    it("should calculate previous balance for expense entry", () => {
      const entry: CashflowEntry = {
        id: "1",
        date: "2025-01-15",
        concept: "Office rent",
        balance: 4500,
        expense: 500,
      }
      const result = getCashflowPreviousBalance(entry)
      expect(result).toBe(5000) // 4500 - 0 + 500
    })

    it("should calculate previous balance for carry over entry with no income/expense", () => {
      const entry: CashflowEntry = {
        id: "1",
        date: "2025-01-01",
        concept: "Carry over",
        balance: 5000,
      }
      const result = getCashflowPreviousBalance(entry)
      expect(result).toBe(5000) // 5000 - 0 + 0
    })

    it("should handle entry with both income and expense", () => {
      const entry: CashflowEntry = {
        id: "1",
        date: "2025-01-15",
        concept: "Mixed transaction",
        balance: 5700,
        income: 1000,
        expense: 300,
      }
      const result = getCashflowPreviousBalance(entry)
      expect(result).toBe(5000) // 5700 - 1000 + 300
    })
  })

  describe("getCashflowOpeningBalance", () => {
    it("should return 0 for empty entries array", () => {
      const result = getCashflowOpeningBalance([])
      expect(result).toBe(0)
    })

    it("should calculate opening balance for income entry", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-15",
          concept: "Invoice payment",
          balance: 6210,
          income: 1210,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(5000) // 6210 - 1210 + 0
    })

    it("should calculate opening balance for expense entry", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-15",
          concept: "Office rent",
          balance: 4500,
          expense: 500,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(5000) // 4500 - 0 + 500
    })

    it("should calculate opening balance for carry over entry with no income/expense", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          balance: 5000,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(5000) // 5000 - 0 + 0
    })

    it("should only use first entry when multiple entries exist", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-15",
          concept: "Invoice payment",
          balance: 6210,
          income: 1210,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(5000) // Only uses first entry
    })

    it("should handle entry with both income and expense", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-15",
          concept: "Mixed transaction",
          balance: 5700,
          income: 1000,
          expense: 300,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(5000) // 5700 - 1000 + 300
    })
  })
})
