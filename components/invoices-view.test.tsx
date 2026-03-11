import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { InvoicesView } from "@/components/invoices-view"
import { TestProviders } from "@/test/test-utils"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock("@/lib/orphan-files", () => ({
  getOrphanFiles: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/lib/use-data", () => {
  const activeStorage = { name: "Test", url: "https://github.com/test/repo" }
  return {
    useData: () => ({
      activeStorage,
      companyName: "Test Co",
      getFileUrl: vi.fn(),
      isDirtyFile: vi.fn().mockReturnValue(false),
      getEditingFile: vi.fn().mockReturnValue(null),
      setEditingFile: vi.fn(),
    }),
  }
})

vi.mock("@/lib/use-storage-data", () => ({
  useStorageData: () => ({
    content: [
      {
        id: "3",
        date: "2025-03-10",
        number: "2025-003",
        client: "Client C",
        concept: "March services",
        subtotal: 3000,
        vat: 630,
        total: 3630,
      },
      {
        id: "1",
        date: "2025-01-15",
        number: "2025-001",
        client: "Acme Corp",
        concept: "Development services",
        subtotal: 1000,
        vat: 210,
        total: 1210,
      },
      {
        id: "2",
        date: "2025-02-20",
        number: "2025-002",
        client: "Client B",
        concept: "Consulting",
        subtotal: 2000,
        vat: 420,
        total: 2420,
      },
    ],
    isPending: false,
    error: null,
  }),
  useFileSha: vi.fn().mockReturnValue(undefined),
}))

describe("InvoicesView", () => {
  it("renders the invoices heading and invoice data", () => {
    render(
      <TestProviders>
        <InvoicesView quarterId="2025.1Q" />
      </TestProviders>
    )

    expect(screen.getByText("Facturas Enviadas")).toBeInTheDocument()
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
  })

  it("renders invoices sorted by date even when content is unsorted", () => {
    render(
      <TestProviders>
        <InvoicesView quarterId="2025.1Q" />
      </TestProviders>
    )

    const bodyRows =
      document.querySelector("tbody")?.querySelectorAll("tr") ?? []
    const clients = Array.from(bodyRows)
      .map((row) => row.querySelector("td:nth-child(3)")?.textContent)
      .filter(Boolean)
    expect(clients).toEqual(["Acme Corp", "Client B", "Client C"])
  })
})
