import { describe, it, expect } from "vitest"
import { generateNextId } from "@/lib/id-utils"

describe("id-utils", () => {
  describe("generateNextId", () => {
    it("should generate first id when items array is empty", () => {
      const result = generateNextId([], "INV")
      expect(result).toBe("INV-1")
    })

    it("should increment from highest id", () => {
      const items = [{ id: "INV-1" }, { id: "INV-2" }, { id: "INV-5" }]
      const result = generateNextId(items, "INV")
      expect(result).toBe("INV-6")
    })

    it("should handle non-sequential ids", () => {
      const items = [{ id: "EXP-10" }, { id: "EXP-3" }, { id: "EXP-7" }]
      const result = generateNextId(items, "EXP")
      expect(result).toBe("EXP-11")
    })

    it("should work with different prefixes", () => {
      const items = [{ id: "Q-1" }, { id: "Q-2" }]
      const result = generateNextId(items, "Q")
      expect(result).toBe("Q-3")
    })

    it("should handle single item", () => {
      const items = [{ id: "TEST-100" }]
      const result = generateNextId(items, "TEST")
      expect(result).toBe("TEST-101")
    })
  })
})
