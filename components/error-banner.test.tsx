import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ErrorBanner } from "@/components/error-banner"

describe("ErrorBanner", () => {
  it("should render title and message", () => {
    render(<ErrorBanner title="Error Title" message="Error message details" />)

    expect(screen.getByText("Error Title")).toBeInTheDocument()
    expect(screen.getByText("Error message details")).toBeInTheDocument()
  })

  it("should render error icon", () => {
    const { container } = render(
      <ErrorBanner title="Error" message="Something went wrong" />
    )

    const icon = container.querySelector("svg")
    expect(icon).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(
      <ErrorBanner
        title="Error"
        message="Message"
        className="custom-class"
      />
    )

    const alert = container.querySelector(".custom-class")
    expect(alert).toBeInTheDocument()
  })
})
