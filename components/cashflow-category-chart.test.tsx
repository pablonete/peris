import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CashflowCategoryChart } from "@/components/cashflow-category-chart"
import { TestProviders } from "@/test/test-utils"
import { CashflowEntry } from "@/lib/types"

const entries: CashflowEntry[] = [
  {
    id: "1",
    date: "2025-01-10",
    concept: "Tax payment",
    expense: 500,
    balance: 4500,
    category: "tax.vat",
  },
  {
    id: "2",
    date: "2025-01-15",
    concept: "Salary",
    expense: 1000,
    balance: 3500,
    category: "payroll.salary",
  },
  {
    id: "3",
    date: "2025-01-20",
    concept: "Invoice",
    income: 2000,
    balance: 5500,
    category: "tax.vat",
  },
  {
    id: "4",
    date: "2025-01-25",
    concept: "Misc expense",
    expense: 50,
    balance: 3450,
  },
]

describe("CashflowCategoryChart", () => {
  it("renders nothing when there are no income or expense entries", () => {
    const { container } = render(
      <TestProviders>
        <CashflowCategoryChart
          entries={[
            {
              id: "1",
              date: "2025-01-01",
              concept: "Carry over",
              balance: 5000,
            },
          ]}
        />
      </TestProviders>
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders the category breakdown heading", () => {
    render(
      <TestProviders>
        <CashflowCategoryChart entries={entries} />
      </TestProviders>
    )
    expect(
      screen.getByText(/GASTOS POR CATEGORÍA|EXPENSES BY CATEGORY/i)
    ).toBeInTheDocument()
  })

  it("renders grouping mode toggle buttons", () => {
    render(
      <TestProviders>
        <CashflowCategoryChart entries={entries} />
      </TestProviders>
    )
    expect(
      screen.getByRole("button", { name: /primer nivel|first level/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /categoría completa|full category/i })
    ).toBeInTheDocument()
  })

  it("switches grouping mode when toggle is clicked", async () => {
    const user = userEvent.setup()
    render(
      <TestProviders>
        <CashflowCategoryChart entries={entries} />
      </TestProviders>
    )
    const fullButton = screen.getByRole("button", {
      name: /categoría completa|full category/i,
    })
    const firstLevelButton = screen.getByRole("button", {
      name: /primer nivel|first level/i,
    })
    await user.click(fullButton)
    expect(fullButton.className).not.toBe(firstLevelButton.className)
  })
})
