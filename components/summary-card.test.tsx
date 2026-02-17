import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SummaryCard } from "@/components/summary-card"

describe("SummaryCard", () => {
  it("should render label and formatted value", () => {
    render(<SummaryCard label="Total Income" value={1500.5} />)

    expect(screen.getByText("Total Income")).toBeInTheDocument()
    expect(screen.getByText(/1500,50/)).toBeInTheDocument()
  })

  it("should apply custom className to value", () => {
    render(
      <SummaryCard
        label="Expenses"
        value={500}
        valueClassName="text-red-500"
      />
    )

    const valueElement = screen.getByText(/500,00/)
    expect(valueElement).toHaveClass("text-red-500")
  })

  it("should handle zero value", () => {
    render(<SummaryCard label="Balance" value={0} />)

    expect(screen.getByText(/0,00/)).toBeInTheDocument()
  })

  it("should handle negative value", () => {
    render(<SummaryCard label="Deficit" value={-250.75} />)

    expect(screen.getByText(/-250,75/)).toBeInTheDocument()
  })
})
