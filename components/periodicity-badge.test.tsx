import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PeriodicityBadge } from "@/components/periodicity-badge"
import { TestProviders } from "@/test/test-utils"

describe("PeriodicityBadge", () => {
  it("should render the periodicity label", () => {
    render(
      <TestProviders>
        <PeriodicityBadge periodicity="1mo" />
      </TestProviders>
    )

    expect(screen.getByText("M")).toBeInTheDocument()
    expect(screen.getByLabelText("Mensual")).toBeInTheDocument()
  })

  it("should not render when periodicity is missing", () => {
    const { container } = render(
      <TestProviders>
        <PeriodicityBadge periodicity={undefined} />
      </TestProviders>
    )

    expect(container).toBeEmptyDOMElement()
  })
})
