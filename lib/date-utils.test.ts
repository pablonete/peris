import { describe, it, expect } from "vitest"
import {
  parseEntryDate,
  formatDateISO,
  addMonths,
  addYears,
  addDays,
} from "./date-utils"

describe("date-utils", () => {
  describe("parseEntryDate", () => {
    it("parses YYYY-MM-DD as local midnight", () => {
      const d = parseEntryDate("2025-07-15")
      expect(d.getFullYear()).toBe(2025)
      expect(d.getMonth()).toBe(6)
      expect(d.getDate()).toBe(15)
    })
  })

  describe("formatDateISO", () => {
    it("formats a date to YYYY-MM-DD", () => {
      expect(formatDateISO(new Date(2025, 6, 5))).toBe("2025-07-05")
    })

    it("pads month and day with leading zeros", () => {
      expect(formatDateISO(new Date(2025, 0, 1))).toBe("2025-01-01")
    })
  })

  describe("addMonths", () => {
    it("adds months to a date", () => {
      const result = addMonths(parseEntryDate("2025-07-15"), 1)
      expect(formatDateISO(result)).toBe("2025-08-15")
    })

    it("rolls over year boundary when adding months", () => {
      const result = addMonths(parseEntryDate("2025-11-30"), 2)
      expect(formatDateISO(result)).toBe("2026-01-30")
    })
  })

  describe("addYears", () => {
    it("adds years to a date", () => {
      const result = addYears(parseEntryDate("2024-08-10"), 1)
      expect(formatDateISO(result)).toBe("2025-08-10")
    })
  })

  describe("addDays", () => {
    it("adds days to a date", () => {
      const result = addDays(parseEntryDate("2025-07-15"), 10)
      expect(formatDateISO(result)).toBe("2025-07-25")
    })

    it("subtracts days when negative", () => {
      const result = addDays(parseEntryDate("2025-07-15"), -30)
      expect(formatDateISO(result)).toBe("2025-06-15")
    })
  })
})
