import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      const result = cn("px-2 py-1", "px-4")
      expect(result).toBe("py-1 px-4")
    })

    it("should handle conditional classes", () => {
      const result = cn("base-class", false && "hidden", "visible")
      expect(result).toBe("base-class visible")
    })

    it("should merge tailwind classes correctly", () => {
      const result = cn("text-red-500", "text-blue-500")
      expect(result).toBe("text-blue-500")
    })

    it("should handle arrays", () => {
      const result = cn(["class1", "class2"], "class3")
      expect(result).toBe("class1 class2 class3")
    })

    it("should filter out falsy values", () => {
      const result = cn("class1", null, undefined, "class2")
      expect(result).toBe("class1 class2")
    })
  })
})
