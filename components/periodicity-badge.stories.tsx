import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { LanguageProvider } from "@/lib/i18n-context"
import { PeriodicityBadge } from "./periodicity-badge"

const meta: Meta<typeof PeriodicityBadge> = {
  component: PeriodicityBadge,
  title: "Components/PeriodicityBadge",
  decorators: [
    (Story) => (
      <LanguageProvider>
        <Story />
      </LanguageProvider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof PeriodicityBadge>

export const Monthly: Story = {
  args: {
    periodicity: "1mo",
  },
}

export const Quarterly: Story = {
  args: {
    periodicity: "3mo",
  },
}

export const Yearly: Story = {
  args: {
    periodicity: "1y",
  },
}
