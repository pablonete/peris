import { describe, it, expect } from "vitest"
import {
  getNextQuarterId,
  getPreviousQuarterId,
  getYearAgoQuarterId,
} from "./quarter-utils"

describe("quarter-utils", () => {
  describe("getPreviousQuarterId", () => {
    it("returns previous quarter in same year", () => {
      expect(getPreviousQuarterId("2025.3Q")).toBe("2025.2Q")
      expect(getPreviousQuarterId("2025.2Q")).toBe("2025.1Q")
    })

    it("rolls back to Q4 of previous year for Q1", () => {
      expect(getPreviousQuarterId("2025.1Q")).toBe("2024.4Q")
    })

    it("returns input unchanged when format is invalid", () => {
      expect(getPreviousQuarterId("invalid")).toBe("invalid")
    })
  })

  describe("getNextQuarterId", () => {
    it("returns the next quarter within the same year", () => {
      expect(getNextQuarterId("2025.1Q")).toBe("2025.2Q")
      expect(getNextQuarterId("2025.2Q")).toBe("2025.3Q")
    })

    it("wraps to the first quarter of the next year", () => {
      expect(getNextQuarterId("2025.4Q")).toBe("2026.1Q")
    })

    it("returns the original input for invalid quarter strings", () => {
      expect(getNextQuarterId("invalid")).toBe("invalid")
    })
  })

  describe("getYearAgoQuarterId", () => {
    it("returns the same quarter one year earlier", () => {
      expect(getYearAgoQuarterId("2025.3Q")).toBe("2024.3Q")
      expect(getYearAgoQuarterId("2025.1Q")).toBe("2024.1Q")
      expect(getYearAgoQuarterId("2025.4Q")).toBe("2024.4Q")
    })

    it("returns input unchanged when format is invalid", () => {
      expect(getYearAgoQuarterId("invalid")).toBe("invalid")
    })
  })
})
