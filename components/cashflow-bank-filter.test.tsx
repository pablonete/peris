import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { CashflowBankFilter } from "@/components/cashflow-bank-filter"
import { TestProviders } from "@/test/test-utils"

describe("CashflowBankFilter", () => {
  it("should not render when there is only one bank", () => {
    const onSelect = vi.fn()
    const { container } = render(
      <TestProviders>
        <CashflowBankFilter
          banks={["Unicaja"]}
          activeBank={null}
          onSelect={onSelect}
        />
      </TestProviders>,
    )

    expect(container.firstChild).toBeNull()
  })

  it("should render all banks button when multiple banks exist", () => {
    const onSelect = vi.fn()
    render(
      <TestProviders>
        <CashflowBankFilter
          banks={["Revolut", "Unicaja"]}
          activeBank={null}
          onSelect={onSelect}
        />
      </TestProviders>,
    )

    expect(screen.getByText("Todo")).toBeInTheDocument()
  })

  it("should render bank buttons with sequence numbers and colored squares", () => {
    const onSelect = vi.fn()
    const banks = ["Revolut", "Santander", "Unicaja"]
    render(
      <TestProviders>
        <CashflowBankFilter
          banks={banks}
          activeBank={null}
          onSelect={onSelect}
        />
      </TestProviders>,
    )

    expect(screen.getByText("01")).toBeInTheDocument()
    expect(screen.getByText("02")).toBeInTheDocument()
    expect(screen.getByText("03")).toBeInTheDocument()
    expect(screen.getByText("Revolut")).toBeInTheDocument()
    expect(screen.getByText("Santander")).toBeInTheDocument()
    expect(screen.getByText("Unicaja")).toBeInTheDocument()
  })

  it("should call onSelect when clicking a bank button", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <TestProviders>
        <CashflowBankFilter
          banks={["Revolut", "Unicaja"]}
          activeBank={null}
          onSelect={onSelect}
        />
      </TestProviders>,
    )

    await user.click(screen.getByText("Unicaja"))
    expect(onSelect).toHaveBeenCalledWith("Unicaja")
  })

  it("should call onSelect with null when clicking all banks button", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <TestProviders>
        <CashflowBankFilter
          banks={["Revolut", "Unicaja"]}
          activeBank="Unicaja"
          onSelect={onSelect}
        />
      </TestProviders>,
    )

    await user.click(screen.getByText("Todo"))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
