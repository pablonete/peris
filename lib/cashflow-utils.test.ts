import { describe, it, expect } from "vitest"
import {
  getCashflowPreviousBalance,
  getCashflowOpeningBalance,
  getCashflowClosingBalance,
  getBankColor,
  getBankColorClass,
  getCashflowTotalsByCategory,
  generateGhostEntries,
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

  describe("getBankColor", () => {
    it("should assign blue to the first bank alphabetically", () => {
      const banks = ["Alpha", "Beta", "Gamma"]
      expect(getBankColor("Alpha", banks)).toBe("blue")
    })

    it("should assign green to the second bank alphabetically", () => {
      const banks = ["Alpha", "Beta", "Gamma"]
      expect(getBankColor("Beta", banks)).toBe("green")
    })

    it("should assign red to the third bank alphabetically", () => {
      const banks = ["Alpha", "Beta", "Gamma"]
      expect(getBankColor("Gamma", banks)).toBe("red")
    })

    it("should repeat the color pattern after three banks", () => {
      const banks = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"]
      expect(getBankColor("Alpha", banks)).toBe("blue") // index 0
      expect(getBankColor("Beta", banks)).toBe("green") // index 1
      expect(getBankColor("Gamma", banks)).toBe("red") // index 2
      expect(getBankColor("Delta", banks)).toBe("blue") // index 3 (repeats)
      expect(getBankColor("Epsilon", banks)).toBe("green") // index 4 (repeats)
      expect(getBankColor("Zeta", banks)).toBe("red") // index 5 (repeats)
    })

    it("should return blue for bank not in the list", () => {
      const banks = ["Alpha", "Beta"]
      expect(getBankColor("Unknown", banks)).toBe("blue")
    })

    it("should handle real bank names alphabetically", () => {
      const banks = ["Revolut", "Santander", "Unicaja"].sort()
      expect(banks).toEqual(["Revolut", "Santander", "Unicaja"])
      expect(getBankColor("Revolut", banks)).toBe("blue")
      expect(getBankColor("Santander", banks)).toBe("green")
      expect(getBankColor("Unicaja", banks)).toBe("red")
    })
  })

  describe("getBankColorClass", () => {
    it("should return blue class for first bank", () => {
      const banks = ["Alpha", "Beta", "Gamma"]
      expect(getBankColorClass("Alpha", banks)).toBe(
        "bg-[hsl(var(--ledger-blue))]"
      )
    })

    it("should return green class for second bank", () => {
      const banks = ["Alpha", "Beta", "Gamma"]
      expect(getBankColorClass("Beta", banks)).toBe(
        "bg-[hsl(var(--ledger-green))]"
      )
    })

    it("should return red class for third bank", () => {
      const banks = ["Alpha", "Beta", "Gamma"]
      expect(getBankColorClass("Gamma", banks)).toBe(
        "bg-[hsl(var(--ledger-red))]"
      )
    })

    it("should repeat color pattern for additional banks", () => {
      const banks = ["Alpha", "Beta", "Gamma", "Delta"]
      expect(getBankColorClass("Delta", banks)).toBe(
        "bg-[hsl(var(--ledger-blue))]"
      )
    })
  })

  describe("getCashflowTotalsByCategory", () => {
    const entries: CashflowEntry[] = [
      {
        id: "1",
        date: "2025-01-10",
        concept: "Tax payment",
        expense: 200,
        balance: 4800,
        category: "tax.vat",
      },
      {
        id: "2",
        date: "2025-01-15",
        concept: "VAT Q4",
        expense: 300,
        balance: 4500,
        category: "tax.vat",
      },
      {
        id: "3",
        date: "2025-01-20",
        concept: "Salary",
        expense: 1000,
        balance: 3500,
        category: "payroll.salary",
      },
      {
        id: "4",
        date: "2025-01-25",
        concept: "Misc",
        expense: 50,
        balance: 3450,
      },
      {
        id: "5",
        date: "2025-01-28",
        concept: "Invoice",
        income: 500,
        balance: 3950,
        category: "tax.vat",
      },
    ]

    it("groups expenses by first-level category in first-level mode", () => {
      const result = getCashflowTotalsByCategory(entries, "first-level")
      const tax = result.find((r) => r.category === "tax")
      const payroll = result.find((r) => r.category === "payroll")
      expect(tax?.expensesTotal).toBe(500)
      expect(payroll?.expensesTotal).toBe(1000)
    })

    it("keeps full category name in full mode", () => {
      const result = getCashflowTotalsByCategory(entries, "full")
      const taxVat = result.find((r) => r.category === "tax.vat")
      const payrollSalary = result.find((r) => r.category === "payroll.salary")
      expect(taxVat?.expensesTotal).toBe(500)
      expect(payrollSalary?.expensesTotal).toBe(1000)
    })

    it("aggregates income by category", () => {
      const result = getCashflowTotalsByCategory(entries, "first-level")
      const tax = result.find((r) => r.category === "tax")
      expect(tax?.invoicesTotal).toBe(500)
    })

    it("includes no-category entries with empty string key", () => {
      const result = getCashflowTotalsByCategory(entries, "first-level")
      const noCategory = result.find((r) => r.category === "")
      expect(noCategory?.expensesTotal).toBe(50)
    })

    it("sorts entries by expensesTotal descending", () => {
      const result = getCashflowTotalsByCategory(entries, "first-level")
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].expensesTotal).toBeGreaterThanOrEqual(
          result[i + 1].expensesTotal
        )
      }
    })

    it("returns empty array when no entries have income or expense", () => {
      const carryOver: CashflowEntry[] = [
        { id: "1", date: "2025-01-01", concept: "Carry over", balance: 5000 },
      ]
      expect(getCashflowTotalsByCategory(carryOver, "full")).toEqual([])
    })

    it("includes income-only categories", () => {
      const incomeEntries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-10",
          concept: "Invoice",
          income: 1000,
          balance: 6000,
          category: "services",
        },
      ]
      const result = getCashflowTotalsByCategory(incomeEntries, "full")
      expect(result).toHaveLength(1)
      expect(result[0].invoicesTotal).toBe(1000)
      expect(result[0].expensesTotal).toBe(0)
    })

    it("includes expense-only categories", () => {
      const expenseEntries: CashflowEntry[] = [
        {
          id: "1",
          date: "2025-01-10",
          concept: "Rent",
          expense: 800,
          balance: 4200,
          category: "facilities",
        },
      ]
      const result = getCashflowTotalsByCategory(expenseEntries, "full")
      expect(result).toHaveLength(1)
      expect(result[0].expensesTotal).toBe(800)
      expect(result[0].invoicesTotal).toBe(0)
    })
  })

  describe("generateGhostEntries", () => {
    const carryOver: CashflowEntry = {
      id: "co",
      date: "2025-07-01",
      concept: "Carry over",
      balance: 5000,
    }

    it("returns empty when no real entries", () => {
      const result = generateGhostEntries([carryOver], [], [], "2025.3Q")
      expect(result).toHaveLength(0)
    })

    it("returns empty when no periodic source entries", () => {
      const entries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-18",
          concept: "Rent",
          expense: 500,
          balance: 4500,
        },
      ]
      const result = generateGhostEntries(entries, [], [], "2025.3Q")
      expect(result).toHaveLength(0)
    })

    it("generates ghost from 1mo entry in current quarter", () => {
      const entries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-15",
          concept: "Monthly rent",
          expense: 500,
          balance: 4500,
          periodicity: "1mo",
        },
      ]
      const result = generateGhostEntries(entries, [], [], "2025.3Q")
      const dates = result.map((g) => g.date)
      expect(dates).toContain("2025-08-15")
      expect(dates).toContain("2025-09-15")
      expect(result.every((g) => g.isGhost)).toBe(true)
    })

    it("generates up to 3 ghost entries per 1mo source within the quarter", () => {
      const entries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-05",
          concept: "Monthly sub",
          expense: 100,
          balance: 4900,
          periodicity: "1mo",
        },
      ]
      const result = generateGhostEntries(entries, [], [], "2025.3Q")
      expect(result.length).toBeLessThanOrEqual(3)
      expect(result.every((g) => g.date > "2025-07-05")).toBe(true)
      expect(result.every((g) => g.date <= "2025-09-30")).toBe(true)
    })

    it("discards ghost entries on or before the last real entry date", () => {
      const entries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-15",
          concept: "Monthly rent",
          expense: 500,
          balance: 4500,
          periodicity: "1mo",
        },
        {
          id: "2",
          date: "2025-08-20",
          concept: "Another payment",
          expense: 200,
          balance: 4300,
        },
      ]
      const result = generateGhostEntries(entries, [], [], "2025.3Q")
      expect(result.every((g) => g.date > "2025-08-20")).toBe(true)
    })

    it("generates ghost from 1mo entry in previous quarter within 30-day window", () => {
      const currentEntries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-18",
          concept: "Invoice",
          income: 1000,
          balance: 6000,
        },
      ]
      const previousEntries: CashflowEntry[] = [
        {
          id: "p1",
          date: "2025-06-20",
          concept: "Monthly rent",
          expense: 500,
          balance: 4500,
          periodicity: "1mo",
        },
      ]
      const result = generateGhostEntries(
        currentEntries,
        previousEntries,
        [],
        "2025.3Q"
      )
      expect(result.some((g) => g.date === "2025-07-20")).toBe(true)
      expect(result.some((g) => g.date === "2025-08-20")).toBe(true)
    })

    it("ignores 1mo entries from previous quarter outside the 30-day window", () => {
      const currentEntries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-18",
          concept: "Invoice",
          income: 1000,
          balance: 6000,
        },
      ]
      const previousEntries: CashflowEntry[] = [
        {
          id: "p1",
          date: "2025-06-01",
          concept: "Old monthly rent",
          expense: 500,
          balance: 4500,
          periodicity: "1mo",
        },
      ]
      const result = generateGhostEntries(
        currentEntries,
        previousEntries,
        [],
        "2025.3Q"
      )
      expect(result.every((g) => g.concept !== "Old monthly rent")).toBe(true)
    })

    it("generates ghost from 3mo entry in previous quarter", () => {
      const currentEntries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-18",
          concept: "Invoice",
          income: 1000,
          balance: 6000,
        },
      ]
      const previousEntries: CashflowEntry[] = [
        {
          id: "p1",
          date: "2025-05-15",
          concept: "Quarterly tax",
          expense: 1000,
          balance: 4000,
          periodicity: "3mo",
        },
      ]
      const result = generateGhostEntries(
        currentEntries,
        previousEntries,
        [],
        "2025.3Q"
      )
      expect(result.some((g) => g.date === "2025-08-15")).toBe(true)
    })

    it("generates ghost from 1y entry in year-ago quarter", () => {
      const currentEntries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-18",
          concept: "Invoice",
          income: 1000,
          balance: 6000,
        },
      ]
      const yearAgoEntries: CashflowEntry[] = [
        {
          id: "ya1",
          date: "2024-08-10",
          concept: "Annual insurance",
          expense: 1200,
          balance: 3800,
          periodicity: "1y",
        },
      ]
      const result = generateGhostEntries(
        currentEntries,
        [],
        yearAgoEntries,
        "2025.3Q"
      )
      expect(result.some((g) => g.date === "2025-08-10")).toBe(true)
    })

    it("ghost entries have isGhost flag and no invoiceId/expenseId/bankSequence", () => {
      const entries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-15",
          concept: "Monthly rent",
          expense: 500,
          balance: 4500,
          periodicity: "1mo",
          invoiceId: "inv-1",
          expenseId: "exp-1",
          bankSequence: 5,
        },
      ]
      const result = generateGhostEntries(entries, [], [], "2025.3Q")
      expect(result.length).toBeGreaterThan(0)
      for (const g of result) {
        expect(g.isGhost).toBe(true)
        expect(g.invoiceId).toBeUndefined()
        expect(g.expenseId).toBeUndefined()
        expect(g.bankSequence).toBeUndefined()
      }
    })

    it("returns empty when invalid quarterId", () => {
      const result = generateGhostEntries(
        [
          {
            id: "1",
            date: "2025-07-15",
            concept: "X",
            expense: 100,
            balance: 0,
            periodicity: "1mo",
          },
        ],
        [],
        [],
        "invalid"
      )
      expect(result).toHaveLength(0)
    })

    it("ghost entries are sorted by date", () => {
      const entries: CashflowEntry[] = [
        carryOver,
        {
          id: "1",
          date: "2025-07-01",
          concept: "Monthly rent",
          expense: 500,
          balance: 4500,
          periodicity: "1mo",
        },
        {
          id: "2",
          date: "2025-07-05",
          concept: "Monthly sub",
          expense: 100,
          balance: 4400,
          periodicity: "1mo",
        },
      ]
      const result = generateGhostEntries(entries, [], [], "2025.3Q")
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].date <= result[i + 1].date).toBe(true)
      }
    })
  })
})
