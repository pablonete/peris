import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"

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
})
