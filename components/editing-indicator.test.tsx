import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EditingIndicator } from "@/components/editing-indicator"

describe("EditingIndicator", () => {
  it("should render indicator when editing", () => {
    render(<EditingIndicator isEditing={true} />)

    const indicator = screen.getByLabelText("Editing")
    expect(indicator).toBeInTheDocument()
  })

  it("should not render when not editing", () => {
    render(<EditingIndicator isEditing={false} />)

    const indicator = screen.queryByLabelText("Editing")
    expect(indicator).not.toBeInTheDocument()
  })

  it("should have correct styling when editing", () => {
    render(<EditingIndicator isEditing={true} />)

    const indicator = screen.getByLabelText("Editing")
    expect(indicator).toHaveClass("h-2", "w-2", "rounded-full")
  })
})
