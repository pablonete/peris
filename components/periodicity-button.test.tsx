import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PeriodicityButton } from "@/components/periodicity-button"
import { TestProviders } from "@/test/test-utils"

describe("PeriodicityButton", () => {
  it("renders the periodicity button when periodicity is set", () => {
    render(
      <TestProviders>
        <PeriodicityButton periodicity="1mo" onChangePeriodicity={vi.fn()} />
      </TestProviders>
    )

    expect(screen.getByLabelText("Mensual")).toBeInTheDocument()
    expect(screen.getByText("M")).toBeInTheDocument()
  })

  it("renders a + button when no periodicity is set", () => {
    render(
      <TestProviders>
        <PeriodicityButton
          periodicity={undefined}
          onChangePeriodicity={vi.fn()}
        />
      </TestProviders>
    )

    expect(screen.getByLabelText("Establecer periodicidad")).toBeInTheDocument()
  })

  it("shows dropdown menu options when clicked", async () => {
    const user = userEvent.setup()

    render(
      <TestProviders>
        <PeriodicityButton periodicity="1mo" onChangePeriodicity={vi.fn()} />
      </TestProviders>
    )

    await user.click(screen.getByLabelText("Mensual"))

    expect(
      screen.getByRole("menuitem", { name: "Ninguna" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitem", { name: "Mensual" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("menuitem", { name: "Trimestral" })
    ).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Anual" })).toBeInTheDocument()
  })

  it("calls onChangePeriodicity with the selected value", async () => {
    const user = userEvent.setup()
    const onChangePeriodicity = vi.fn()

    render(
      <TestProviders>
        <PeriodicityButton
          periodicity="1mo"
          onChangePeriodicity={onChangePeriodicity}
        />
      </TestProviders>
    )

    await user.click(screen.getByLabelText("Mensual"))
    await user.click(screen.getByRole("menuitem", { name: "Trimestral" }))

    expect(onChangePeriodicity).toHaveBeenCalledWith("3mo")
  })

  it("calls onChangePeriodicity with undefined when None is selected", async () => {
    const user = userEvent.setup()
    const onChangePeriodicity = vi.fn()

    render(
      <TestProviders>
        <PeriodicityButton
          periodicity="1mo"
          onChangePeriodicity={onChangePeriodicity}
        />
      </TestProviders>
    )

    await user.click(screen.getByLabelText("Mensual"))
    await user.click(screen.getByRole("menuitem", { name: "Ninguna" }))

    expect(onChangePeriodicity).toHaveBeenCalledWith(undefined)
  })
})
