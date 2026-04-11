import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { LinkingView } from "@/components/linking-view"
import { TestProviders } from "@/test/test-utils"

const setEditingFile = vi.fn()
const getEditingFile = vi.fn().mockReturnValue(null)

const currentQuarterExpenses = [
  {
    id: "exp-61",
    date: "2026-03-18",
    vendor: "Vendor A",
    concept: "Quarter-end tax",
    vat: [],
    total: 150,
  },
]

const currentQuarterCashflow = [
  {
    id: "cf-current",
    date: "2026-03-20",
    concept: "Current quarter payment",
    bankName: "Unicaja",
    bankSequence: 1,
    expense: 150,
    balance: 850,
  },
]

const nextQuarterCashflow = [
  {
    id: "cf-next",
    date: "2026-04-03",
    concept: "Next quarter payment",
    bankName: "Revolut",
    bankSequence: 1,
    expense: 150,
    balance: 700,
  },
]

vi.mock("@/lib/use-data", () => ({
  useData: () => ({
    getEditingFile,
    setEditingFile,
  }),
}))

vi.mock("@/lib/use-storage-data", () => ({
  useStorageData: (quarterId: string, type: string) => {
    if (quarterId === "2026.1Q" && type === "invoices") {
      return { content: [], isPending: false, error: null }
    }

    if (quarterId === "2026.1Q" && type === "expenses") {
      return {
        content: currentQuarterExpenses,
        isPending: false,
        error: null,
      }
    }

    if (quarterId === "2026.1Q" && type === "cashflow") {
      return {
        content: currentQuarterCashflow,
        isPending: false,
        error: null,
      }
    }

    if (quarterId === "2026.2Q" && type === "cashflow") {
      return {
        content: nextQuarterCashflow,
        isPending: false,
        error: null,
      }
    }

    return { content: null, isPending: false, error: null }
  },
  useFileSha: (quarterId: string) =>
    quarterId === "2026.2Q" ? "sha-next" : "sha-current",
}))

describe("LinkingView", () => {
  beforeEach(() => {
    setEditingFile.mockClear()
    getEditingFile.mockClear()
    getEditingFile.mockReturnValue(null)
  })

  it("switches the cashflow panel to next-quarter entries when toggled", async () => {
    const user = userEvent.setup()

    render(
      <TestProviders>
        <LinkingView quarterId="2026.1Q" />
      </TestProviders>
    )

    expect(screen.getByText("Current quarter payment")).toBeInTheDocument()
    expect(screen.queryByText("Next quarter payment")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Siguiente trimestre" })
    )

    expect(screen.getByText("Next quarter payment")).toBeInTheDocument()
    expect(
      screen.queryByText("Current quarter payment")
    ).not.toBeInTheDocument()
  })

  it("writes a prefixed expense id into the next-quarter cashflow entry", async () => {
    const user = userEvent.setup()

    render(
      <TestProviders>
        <LinkingView quarterId="2026.1Q" />
      </TestProviders>
    )

    await user.click(
      screen.getByRole("button", { name: "Siguiente trimestre" })
    )
    await user.click(screen.getByLabelText("Vincular con flujo de caja"))
    await user.click(screen.getByLabelText("Vincular con este movimiento"))

    expect(setEditingFile).toHaveBeenCalledWith(
      "2026.2Q",
      "cashflow",
      [
        expect.objectContaining({
          id: "cf-next",
          expenseId: "[2026.2Q]exp-61",
        }),
      ],
      "sha-next"
    )
  })
})
