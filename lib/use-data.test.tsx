import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useData } from "./use-data"
import { DataTestProviders } from "@/test/test-utils"

describe("useData", () => {
  it("returns expected properties", () => {
    const { result } = renderHook(() => useData(), {
      wrapper: DataTestProviders,
    })

    expect(result.current).toHaveProperty("activeStorage")
    expect(result.current).toHaveProperty("storages")
    expect(result.current).toHaveProperty("companyName")
    expect(result.current).toHaveProperty("quarters")
    expect(result.current).toHaveProperty("editingCount")
    expect(result.current).toHaveProperty("commitChanges")
    expect(result.current).toHaveProperty("isDirtyFile")
    expect(result.current).toHaveProperty("updateFile")
    expect(result.current).toHaveProperty("getFileUrl")
  })

  it("returns empty companyName when no peris config is loaded", () => {
    const { result } = renderHook(() => useData(), {
      wrapper: DataTestProviders,
    })

    expect(result.current.companyName).toBe("")
  })

  it("isDirtyFile returns false when no files are being edited", () => {
    const { result } = renderHook(() => useData(), {
      wrapper: DataTestProviders,
    })

    expect(result.current.isDirtyFile("2025.1Q", "invoices")).toBe(false)
  })

  it("getFileUrl returns correct URL format", () => {
    const { result } = renderHook(() => useData(), {
      wrapper: DataTestProviders,
    })

    const url = result.current.getFileUrl("2025.1Q", "invoices", "test.pdf")
    expect(url).toContain("raw.githubusercontent.com")
    expect(url).toContain("2025.1Q/invoices/test.pdf")
  })
})
