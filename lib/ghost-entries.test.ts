import { describe, it, expect } from "vitest"
import {
  generateGhostEntries,
  getPreviousQuarterId,
  getYearAgoQuarterId,
  isGhostEntry,
} from "./ghost-entries"
import { CashflowEntry } from "./types"

describe("ghost-entries", () => {
  describe("getPreviousQuarterId", () => {
    it("returns previous quarter in same year", () => {
      expect(getPreviousQuarterId("2025.3Q")).toBe("2025.2Q")
      expect(getPreviousQuarterId("2025.2Q")).toBe("2025.1Q")
    })

    it("rolls back to Q4 of previous year for Q1", () => {
      expect(getPreviousQuarterId("2025.1Q")).toBe("2024.4Q")
    })
  })

  describe("getYearAgoQuarterId", () => {
    it("returns the same quarter one year earlier", () => {
      expect(getYearAgoQuarterId("2025.3Q")).toBe("2024.3Q")
      expect(getYearAgoQuarterId("2025.1Q")).toBe("2024.1Q")
    })
  })

  describe("isGhostEntry", () => {
    it("returns false for regular entries", () => {
      const entry: CashflowEntry = {
        id: "1",
        date: "2025-07-01",
        concept: "X",
        balance: 100,
      }
      expect(isGhostEntry(entry)).toBe(false)
    })

    it("returns true for ghost entries", () => {
      const original: CashflowEntry = {
        id: "1",
        date: "2025-07-01",
        concept: "X",
        balance: 100,
      }
      const ghost = {
        ...original,
        isGhost: true as const,
        originalEntry: original,
        originalQuarterId: "2025.3Q",
      }
      expect(isGhostEntry(ghost)).toBe(true)
    })
  })

  describe("generateGhostEntries", () => {
    const carryOver: CashflowEntry = {
      id: "co",
      date: "2025-07-01",
      concept: "Carry over",
      balance: 5000,
    }

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
      expect(generateGhostEntries(entries, [], [], "2025.3Q")).toEqual([])
    })

    it("generates ghost entries for a new quarter with no real entries", () => {
      const source: CashflowEntry = {
        id: "p1",
        date: "2025-06-15",
        concept: "Monthly rent",
        expense: 500,
        balance: 4500,
        periodicity: "1mo",
      }
      const result = generateGhostEntries([carryOver], [source], [], "2025.3Q")
      expect(result.map((g) => g.date)).toEqual([
        "2025-07-15",
        "2025-08-15",
        "2025-09-15",
      ])
    })

    it("generates 2 ghosts for 1mo entry at start of quarter (Aug + Sep)", () => {
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
      expect(result.map((g) => g.date)).toEqual(["2025-08-05", "2025-09-05"])
    })

    it("generates 2 ghosts for 1mo entry in mid-quarter (only Aug + Sep fit after last entry)", () => {
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
      expect(result.map((g) => g.date)).toEqual(["2025-08-15", "2025-09-15"])
    })

    it("generates correct dates when month-end source overflows past February", () => {
      const q1Entries: CashflowEntry[] = [
        { id: "co", date: "2025-01-01", concept: "Carry over", balance: 5000 },
        {
          id: "1",
          date: "2025-01-31",
          concept: "Monthly rent",
          expense: 500,
          balance: 4500,
          periodicity: "1mo",
        },
      ]
      // Jan 31 + 1 month = Mar 3 (JS overflow since Feb 2025 has 28 days)
      // Jan 31 + 2 months = Mar 31
      // Both are within Q1 (Jan–Mar)
      const result = generateGhostEntries(q1Entries, [], [], "2025.1Q")
      expect(result.map((g) => g.date)).toEqual(["2025-03-03", "2025-03-31"])
    })

    it("generates ghosts from 1mo entry in previous quarter within 30-day window", () => {
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
      expect(result.map((g) => g.date)).toEqual([
        "2025-07-20",
        "2025-08-20",
        "2025-09-20",
      ])
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
      expect(
        generateGhostEntries(currentEntries, previousEntries, [], "2025.3Q")
      ).toEqual([])
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
      expect(result.map((g) => g.date)).toEqual(["2025-08-15"])
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
      expect(result.map((g) => g.date)).toEqual(["2025-08-10"])
    })

    it("ghost entry references originalEntry and originalQuarterId", () => {
      const source: CashflowEntry = {
        id: "1",
        date: "2025-07-15",
        concept: "Monthly rent",
        expense: 500,
        balance: 4500,
        periodicity: "1mo",
        bankSequence: 3,
      }
      const entries: CashflowEntry[] = [carryOver, source]
      const result = generateGhostEntries(entries, [], [], "2025.3Q")
      expect(result.length).toBeGreaterThan(0)
      for (const g of result) {
        expect(g.originalEntry).toBe(source)
        expect(g.originalQuarterId).toBe("2025.3Q")
        expect(g.isGhost).toBe(true)
        expect(g.invoiceId).toBeUndefined()
        expect(g.expenseId).toBeUndefined()
        expect(g.bankSequence).toBeUndefined()
      }
    })

    it("ghost from previous quarter has previousQuarterId as originalQuarterId", () => {
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
      const prevSource: CashflowEntry = {
        id: "p1",
        date: "2025-06-20",
        concept: "Monthly rent",
        expense: 500,
        balance: 4500,
        periodicity: "1mo",
        bankSequence: 7,
      }
      const result = generateGhostEntries(
        currentEntries,
        [prevSource],
        [],
        "2025.3Q"
      )
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].originalEntry).toBe(prevSource)
      expect(result[0].originalQuarterId).toBe("2025.2Q")
    })

    it("returns empty when invalid quarterId", () => {
      expect(
        generateGhostEntries(
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
      ).toEqual([])
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
      const dates = result.map((g) => g.date)
      expect(dates).toEqual([...dates].sort())
    })

    it("assigns balance incrementally from last real entry balance", () => {
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
      expect(result[0].balance).toBe(4000)
      expect(result[1].balance).toBe(3500)
    })

    it("accepts null for previousEntries and yearAgoEntries", () => {
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
      const result = generateGhostEntries(entries, null, null, "2025.3Q")
      expect(result.map((g) => g.date)).toEqual(["2025-08-15", "2025-09-15"])
    })
  })
})
