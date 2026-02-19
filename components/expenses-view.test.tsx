import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ExpensesView } from "@/components/expenses-view"
import { TestProviders } from "@/test/test-utils"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock("@/lib/orphan-files", () => ({
  getOrphanFiles: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/lib/use-data", () => {
  const activeStorage = { name: "Test", url: "https://github.com/test/repo" }
  return {
    useData: () => ({
      activeStorage,
      companyName: "Test Co",
      isDirtyFile: vi.fn().mockReturnValue(false),
      getEditingFile: vi.fn().mockReturnValue(null),
      setEditingFile: vi.fn(),
    }),
  }
})

vi.mock("@/lib/use-storage-data", () => ({
  useStorageData: () => ({
    content: [
      {
        id: "1",
        date: "2025-01-10",
        vendor: "Office Supplies Ltd",
        concept: "Stationery",
        vat: [{ rate: 21, subtotal: 100, amount: 21 }],
        total: 121,
      },
    ],
    isPending: false,
    error: null,
  }),
  useFileSha: vi.fn().mockReturnValue(undefined),
}))

describe("ExpensesView", () => {
  it("renders the expenses heading and expense data", () => {
    render(
      <TestProviders>
        <ExpensesView quarterId="2025.1Q" />
      </TestProviders>
    )

    expect(screen.getByText("Gastos")).toBeInTheDocument()
    expect(screen.getByText("Office Supplies Ltd")).toBeInTheDocument()
  })
})
