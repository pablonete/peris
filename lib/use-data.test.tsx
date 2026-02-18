import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode } from "react"
import { useData } from "./use-data"
import { StorageProvider } from "./storage-context"
import { EditingStateProvider } from "./editing-state-context"

function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>
        <EditingStateProvider>{children}</EditingStateProvider>
      </StorageProvider>
    </QueryClientProvider>
  )
}

describe("useData", () => {
  it("returns expected properties", () => {
    const { result } = renderHook(() => useData(), {
      wrapper: TestWrapper,
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

  it("returns default companyName from sample storage", () => {
    const { result } = renderHook(() => useData(), {
      wrapper: TestWrapper,
    })

    expect(result.current.companyName).toBe("Sample Data")
  })

  it("isDirtyFile returns false when no files are being edited", () => {
    const { result } = renderHook(() => useData(), {
      wrapper: TestWrapper,
    })

    expect(result.current.isDirtyFile("2025.1Q", "invoices")).toBe(false)
  })

  it("getFileUrl returns correct URL format", () => {
    const { result } = renderHook(() => useData(), {
      wrapper: TestWrapper,
    })

    const url = result.current.getFileUrl("2025.1Q", "invoices", "test.pdf")
    expect(url).toContain("raw.githubusercontent.com")
    expect(url).toContain("2025.1Q/invoices/test.pdf")
  })
})
