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
        id: "3",
        date: "2025-03-01",
        vendor: "Vendor C",
        concept: "March item",
        vat: [],
        total: 300,
      },
      {
        id: "1",
        date: "2025-01-10",
        vendor: "Office Supplies Ltd",
        concept: "Stationery",
        vat: [{ rate: 21, subtotal: 100, amount: 21 }],
        total: 121,
      },
      {
        id: "2",
        date: "2025-02-01",
        vendor: "Vendor B",
        concept: "February item",
        vat: [],
        total: 200,
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

  it("renders expenses sorted by date even when content is unsorted", () => {
    render(
      <TestProviders>
        <ExpensesView quarterId="2025.1Q" />
      </TestProviders>
    )

    const bodyRows =
      document.querySelector("tbody")?.querySelectorAll("tr") ?? []
    const vendors = Array.from(bodyRows)
      .map((row) => row.querySelector("td:nth-child(3)")?.textContent)
      .filter(Boolean)
    expect(vendors).toEqual(["Office Supplies Ltd", "Vendor B", "Vendor C"])
  })
})
