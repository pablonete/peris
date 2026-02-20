import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ErrorBanner } from "./error-banner"

const meta: Meta<typeof ErrorBanner> = {
  component: ErrorBanner,
  title: "Components/ErrorBanner",
}

export default meta

type Story = StoryObj<typeof ErrorBanner>

export const Default: Story = {
  args: {
    title: "Something went wrong",
    message: "Could not load data. Please try again later.",
  },
}

export const WithLongMessage: Story = {
  args: {
    title: "GitHub API Error",
    message:
      "Failed to fetch repository contents: 403 Forbidden. Check that your token has the required permissions (repo scope) and that the repository exists.",
  },
}
