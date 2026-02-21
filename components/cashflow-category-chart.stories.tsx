import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { LanguageProvider } from "@/lib/i18n-context"
import { CashflowCategoryChart } from "./cashflow-category-chart"
import { CashflowEntry } from "@/lib/types"

const meta: Meta<typeof CashflowCategoryChart> = {
  component: CashflowCategoryChart,
  title: "Components/CashflowCategoryChart",
  decorators: [
    (Story) => (
      <LanguageProvider>
        <div className="p-4 max-w-2xl">
          <Story />
        </div>
      </LanguageProvider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof CashflowCategoryChart>

const sampleEntries: CashflowEntry[] = [
  {
    id: "1",
    date: "2025-01-05",
    concept: "VAT Q4",
    expense: 800,
    balance: 9200,
    category: "tax.vat",
  },
  {
    id: "2",
    date: "2025-01-10",
    concept: "Income tax",
    expense: 400,
    balance: 8800,
    category: "tax.income",
  },
  {
    id: "3",
    date: "2025-01-15",
    concept: "Payroll",
    expense: 2500,
    balance: 6300,
    category: "payroll.salary",
  },
  {
    id: "4",
    date: "2025-01-20",
    concept: "Office rent",
    expense: 900,
    balance: 5400,
    category: "facilities.rent",
  },
  {
    id: "5",
    date: "2025-01-22",
    concept: "Misc supplies",
    expense: 150,
    balance: 5250,
  },
  {
    id: "6",
    date: "2025-01-25",
    concept: "Client invoice A",
    income: 3600,
    balance: 8850,
    category: "services",
  },
  {
    id: "7",
    date: "2025-01-28",
    concept: "Client invoice B",
    income: 1200,
    balance: 10050,
    category: "services",
  },
]

export const WithMultipleCategories: Story = {
  args: { entries: sampleEntries },
}

export const NoCategory: Story = {
  args: {
    entries: [
      {
        id: "1",
        date: "2025-01-10",
        concept: "Unknown expense",
        expense: 200,
        balance: 4800,
      },
      {
        id: "2",
        date: "2025-01-15",
        concept: "Unknown income",
        income: 500,
        balance: 5300,
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    entries: [
      { id: "1", date: "2025-01-01", concept: "Carry over", balance: 5000 },
    ],
  },
}
