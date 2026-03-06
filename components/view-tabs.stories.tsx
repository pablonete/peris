import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { LanguageProvider } from "@/lib/i18n-context"
import { ViewTabs } from "./view-tabs"

const meta: Meta<typeof ViewTabs> = {
  component: ViewTabs,
  title: "Components/ViewTabs",
  decorators: [
    (Story) => (
      <LanguageProvider>
        <div className="border border-border">
          <Story />
        </div>
      </LanguageProvider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ViewTabs>

const editingFile = { content: "data" }

export const InvoicesActive: Story = {
  args: {
    quarterId: "2025.1Q",
    selectedView: "invoices",
    getEditingFile: () => null,
  },
}

export const ExpensesActive: Story = {
  args: {
    quarterId: "2025.1Q",
    selectedView: "expenses",
    getEditingFile: () => null,
  },
}

export const CashflowActive: Story = {
  args: {
    quarterId: "2025.1Q",
    selectedView: "cashflow",
    getEditingFile: () => null,
  },
}

export const WithUnsavedChanges: Story = {
  args: {
    quarterId: "2025.1Q",
    selectedView: "invoices",
    getEditingFile: (_, view) => (view === "expenses" ? editingFile : null),
  },
}
