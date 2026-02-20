import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { CashflowView } from "@/components/cashflow-view"
import { TestProviders } from "@/test/test-utils"

vi.mock("@/lib/use-data", () => ({
  useData: () => ({
    activeStorage: { name: "Test", url: "https://github.com/test/repo" },
    companyName: "Test Co",
    quarters: ["2025.1Q"],
    isDirtyFile: vi.fn().mockReturnValue(false),
  }),
}))

vi.mock("@/lib/use-storage-data", () => ({
  useStorageData: () => ({
    content: {
      companyName: "Test Co",
      entries: [
        {
          id: "1",
          date: "2025-01-01",
          concept: "Carry over",
          balance: 5000,
        },
        {
          id: "2",
          date: "2025-01-15",
          concept: "Client payment",
          income: 1210,
          balance: 6210,
        },
      ],
    },
    isPending: false,
    error: null,
  }),
}))

vi.mock("@/lib/use-peris-config", () => ({
  usePerisConfig: () => ({
    config: null,
    categories: [],
  }),
}))

describe("CashflowView", () => {
  it("renders the cashflow heading and entries", () => {
    render(
      <TestProviders>
        <CashflowView quarterId="2025.1Q" />
      </TestProviders>
    )

    expect(screen.getByText("Flujo de caja")).toBeInTheDocument()
    expect(screen.getByText("Client payment")).toBeInTheDocument()
  })
})
