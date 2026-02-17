import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PaymentDateCell } from "@/components/payment-date-cell"
import { TestProviders } from "@/test/test-utils"

describe("PaymentDateCell", () => {
  it("should render formatted date for paid invoice", () => {
    render(
      <TestProviders>
        <PaymentDateCell paymentDate="2024-01-15" variant="invoice" />
      </TestProviders>
    )

    expect(screen.getByText("15 Jan 2024")).toBeInTheDocument()
  })

  it("should render formatted date for paid expense", () => {
    render(
      <TestProviders>
        <PaymentDateCell paymentDate="2024-02-20" variant="expense" />
      </TestProviders>
    )

    expect(screen.getByText("20 Feb 2024")).toBeInTheDocument()
  })

  it("should render pending badge when no payment date", () => {
    render(
      <TestProviders>
        <PaymentDateCell paymentDate={null} variant="invoice" />
      </TestProviders>
    )

    expect(screen.getByText(/pendiente/i)).toBeInTheDocument()
  })

  it("should render pending badge when payment date is undefined", () => {
    render(
      <TestProviders>
        <PaymentDateCell paymentDate={undefined} variant="expense" />
      </TestProviders>
    )

    expect(screen.getByText(/pendiente/i)).toBeInTheDocument()
  })
})
