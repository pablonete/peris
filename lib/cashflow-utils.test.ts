import { describe, it, expect } from "vitest"
import {
  getCashflowPreviousBalance,
  getCashflowOpeningBalance,
  getCashflowClosingBalance,
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

    it("should calculate opening balance for single entry", () => {
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
      expect(result).toBe(5000)
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
      expect(result).toBe(5000)
    })

    it("should calculate opening balance for carry over entry", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          balance: 5000,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(5000)
    })

    it("should use first entry for single bank with multiple entries", () => {
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
      expect(result).toBe(5000)
    })

    it("should calculate opening balance for single bank", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-15",
          concept: "Invoice payment",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6210,
          income: 1210,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(5000)
    })

    it("should aggregate opening balance from multiple banks", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Revolut",
          balance: 3000,
        },
        {
          id: "3",
          date: "2025-01-15",
          concept: "Invoice payment",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6210,
          income: 1210,
        },
        {
          id: "4",
          date: "2025-01-20",
          concept: "Expense",
          bankName: "Revolut",
          bankSequence: 1,
          balance: 2700,
          expense: 300,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(8000)
    })

    it("should handle banks with income/expense in first entry", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-05",
          concept: "First transaction",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6000,
          income: 1000,
        },
        {
          id: "2",
          date: "2025-01-10",
          concept: "Carry over",
          bankName: "Revolut",
          balance: 2000,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(7000)
    })

    it("should handle entries without bankName as separate group", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          balance: 1000,
        },
        {
          id: "2",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(6000)
    })

    it("should handle three banks with mixed transactions", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Revolut",
          balance: 3000,
        },
        {
          id: "3",
          date: "2025-01-02",
          concept: "First transaction",
          bankName: "N26",
          bankSequence: 1,
          balance: 2500,
          income: 500,
        },
        {
          id: "4",
          date: "2025-01-15",
          concept: "Payment",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6210,
          income: 1210,
        },
      ]
      const result = getCashflowOpeningBalance(entries)
      expect(result).toBe(10000)
    })

    it("should match totals when all banks vs individual bank sums", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Revolut",
          balance: 3000,
        },
        {
          id: "3",
          date: "2025-01-15",
          concept: "Invoice payment",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6210,
          income: 1210,
        },
        {
          id: "4",
          date: "2025-01-20",
          concept: "Expense",
          bankName: "Revolut",
          bankSequence: 1,
          balance: 2700,
          expense: 300,
        },
      ]

      const allBanksTotal = getCashflowOpeningBalance(entries)

      const unicajaEntries = entries.filter((e) => e.bankName === "Unicaja")
      const revolutEntries = entries.filter((e) => e.bankName === "Revolut")
      const unicajaOpening = getCashflowOpeningBalance(unicajaEntries)
      const revolutOpening = getCashflowOpeningBalance(revolutEntries)
      const sumOfIndividual = unicajaOpening + revolutOpening

      expect(allBanksTotal).toBe(8000)
      expect(unicajaOpening).toBe(5000)
      expect(revolutOpening).toBe(3000)
      expect(allBanksTotal).toBe(sumOfIndividual)
    })
  })

  describe("getCashflowClosingBalance", () => {
    it("should return 0 for empty entries array", () => {
      const result = getCashflowClosingBalance([])
      expect(result).toBe(0)
    })

    it("should return balance of single entry", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-15",
          concept: "Invoice payment",
          balance: 6210,
          income: 1210,
        },
      ]
      const result = getCashflowClosingBalance(entries)
      expect(result).toBe(6210)
    })

    it("should return balance of last entry for single bank", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-15",
          concept: "Invoice payment",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6210,
          income: 1210,
        },
      ]
      const result = getCashflowClosingBalance(entries)
      expect(result).toBe(6210)
    })

    it("should aggregate closing balance from multiple banks", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Revolut",
          balance: 3000,
        },
        {
          id: "3",
          date: "2025-01-15",
          concept: "Invoice payment",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6210,
          income: 1210,
        },
        {
          id: "4",
          date: "2025-01-20",
          concept: "Expense",
          bankName: "Revolut",
          bankSequence: 1,
          balance: 2700,
          expense: 300,
        },
      ]
      const result = getCashflowClosingBalance(entries)
      expect(result).toBe(8910)
    })

    it("should use last entry per bank when multiple entries exist", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-10",
          concept: "Payment",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6000,
          income: 1000,
        },
        {
          id: "3",
          date: "2025-01-15",
          concept: "Another payment",
          bankName: "Unicaja",
          bankSequence: 2,
          balance: 7500,
          income: 1500,
        },
      ]
      const result = getCashflowClosingBalance(entries)
      expect(result).toBe(7500)
    })

    it("should handle entries without bankName as separate group", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "First entry",
          balance: 1000,
        },
        {
          id: "2",
          date: "2025-01-05",
          concept: "Second entry",
          balance: 1500,
        },
        {
          id: "3",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
      ]
      const result = getCashflowClosingBalance(entries)
      expect(result).toBe(6500)
    })

    it("should match calculated closing when entries are consistent", () => {
      const entries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          bankName: "Unicaja",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-15",
          concept: "Income",
          bankName: "Unicaja",
          bankSequence: 1,
          balance: 6210,
          income: 1210,
        },
        {
          id: "3",
          date: "2025-01-20",
          concept: "Expense",
          bankName: "Unicaja",
          bankSequence: 2,
          balance: 5710,
          expense: 500,
        },
      ]

      const opening = getCashflowOpeningBalance(entries)
      const closing = getCashflowClosingBalance(entries)
      const totalIncome = entries.reduce((s, e) => s + (e.income ?? 0), 0)
      const totalExpense = entries.reduce((s, e) => s + (e.expense ?? 0), 0)
      const calculatedClosing = opening + totalIncome - totalExpense

      expect(closing).toBe(5710)
      expect(calculatedClosing).toBe(5710)
      expect(closing).toBe(calculatedClosing)
    })
  })
})
