import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { WelcomeView } from "@/components/welcome-view"
import { TestProviders } from "@/test/test-utils"

vi.mock("@/lib/use-data", () => ({
  useData: () => ({
    quarters: ["2025.1Q"],
  }),
}))

vi.mock("@/lib/use-storage-data", () => ({
  useStorageData: () => ({
    content: null,
    isPending: false,
    error: null,
  }),
}))

describe("WelcomeView", () => {
  it("renders the ledger book heading", () => {
    render(
      <TestProviders>
        <WelcomeView onNavigate={vi.fn()} />
      </TestProviders>
    )

    expect(screen.getByText("Peris")).toBeInTheDocument()
  })
})
