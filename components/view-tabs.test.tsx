import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ViewTabs } from "@/components/view-tabs"
import { TestProviders } from "@/test/test-utils"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

describe("ViewTabs", () => {
  it("renders all three view tabs", () => {
    render(
      <TestProviders>
        <ViewTabs
          quarterId="2025.1Q"
          selectedView="invoices"
          getEditingFile={vi.fn().mockReturnValue(null)}
        />
      </TestProviders>
    )

    expect(screen.getByText("Facturas")).toBeInTheDocument()
    expect(screen.getByText("Gastos")).toBeInTheDocument()
    expect(screen.getByText("Flujo de caja")).toBeInTheDocument()
  })

  it("links to the correct routes", () => {
    render(
      <TestProviders>
        <ViewTabs
          quarterId="2025.1Q"
          selectedView="invoices"
          getEditingFile={vi.fn().mockReturnValue(null)}
        />
      </TestProviders>
    )

    expect(screen.getByText("Facturas").closest("a")).toHaveAttribute(
      "href",
      "/invoices?q=2025.1Q"
    )
    expect(screen.getByText("Gastos").closest("a")).toHaveAttribute(
      "href",
      "/expenses?q=2025.1Q"
    )
    expect(screen.getByText("Flujo de caja").closest("a")).toHaveAttribute(
      "href",
      "/cashflow?q=2025.1Q"
    )
  })

  it("highlights the active tab with a solid border", () => {
    render(
      <TestProviders>
        <ViewTabs
          quarterId="2025.1Q"
          selectedView="cashflow"
          getEditingFile={vi.fn().mockReturnValue(null)}
        />
      </TestProviders>
    )

    const cashflowLink = screen.getByText("Flujo de caja").closest("a")
    expect(cashflowLink).toHaveClass("border-foreground")

    const invoicesLink = screen.getByText("Facturas").closest("a")
    expect(invoicesLink).toHaveClass("border-transparent")
  })

  it("shows an edit indicator for views with unsaved changes", () => {
    const editingFile = { content: "data" }
    render(
      <TestProviders>
        <ViewTabs
          quarterId="2025.1Q"
          selectedView="invoices"
          getEditingFile={(_, view) =>
            view === "expenses" ? editingFile : null
          }
        />
      </TestProviders>
    )

    expect(
      screen.getByLabelText("Cambios sin guardar")
    ).toBeInTheDocument()
  })

  it("does not show edit indicator when no views have unsaved changes", () => {
    render(
      <TestProviders>
        <ViewTabs
          quarterId="2025.1Q"
          selectedView="invoices"
          getEditingFile={vi.fn().mockReturnValue(null)}
        />
      </TestProviders>
    )

    expect(
      screen.queryByLabelText("Cambios sin guardar")
    ).not.toBeInTheDocument()
  })
})
