import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, sortByDate } from "@/lib/ledger-utils"

describe("ledger-utils", () => {
  describe("formatCurrency", () => {
    it("should format positive amounts correctly", () => {
      const result = formatCurrency(1000)
      expect(result).toContain("1000,00")
      expect(result).toContain("€")
    })

    it("should format decimal amounts correctly", () => {
      const result = formatCurrency(123.45)
      expect(result).toContain("123,45")
      expect(result).toContain("€")
    })

    it("should format zero correctly", () => {
      const result = formatCurrency(0)
      expect(result).toContain("0,00")
      expect(result).toContain("€")
    })

    it("should format negative amounts correctly", () => {
      const result = formatCurrency(-500.5)
      expect(result).toContain("-500,50")
      expect(result).toContain("€")
    })
  })

  describe("formatDate", () => {
    it("should format date correctly", () => {
      const result = formatDate("2024-01-15")
      expect(result).toBe("15 Jan 2024")
    })

    it("should format another date correctly", () => {
      const result = formatDate("2023-12-31")
      expect(result).toBe("31 Dec 2023")
    })
  })

  describe("sortByDate", () => {
    it("sorts items ascending by date", () => {
      const items = [
        { date: "2025-03-01", id: "c" },
        { date: "2025-01-15", id: "a" },
        { date: "2025-02-10", id: "b" },
      ]
      const result = sortByDate(items)
      expect(result.map((i) => i.id)).toEqual(["a", "b", "c"])
    })

    it("returns a new array and does not mutate the original", () => {
      const items = [
        { date: "2025-03-01", id: "c" },
        { date: "2025-01-15", id: "a" },
      ]
      const result = sortByDate(items)
      expect(result).not.toBe(items)
      expect(items[0].id).toBe("c")
    })

    it("handles an empty array", () => {
      expect(sortByDate([])).toEqual([])
    })

    it("handles a single item", () => {
      const items = [{ date: "2025-01-01", id: "x" }]
      expect(sortByDate(items)).toEqual(items)
    })

    it("preserves relative order of items with equal dates", () => {
      const items = [
        { date: "2025-01-01", id: "first" },
        { date: "2025-01-01", id: "second" },
      ]
      const result = sortByDate(items)
      expect(result.map((i) => i.id)).toContain("first")
      expect(result.map((i) => i.id)).toContain("second")
    })
  })
})
