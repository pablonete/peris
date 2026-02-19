import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { InvoicesView } from "@/components/invoices-view"
import { TestProviders } from "@/test/test-utils"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock("@/components/new-invoice-dialog", () => ({
  NewInvoiceDialog: () => null,
  DuplicateInvoiceDialog: () => null,
}))

vi.mock("@/components/invoice-row-actions", () => ({
  InvoiceRowActions: () => null,
}))

vi.mock("@/components/delete-invoice-alert", () => ({
  DeleteInvoiceAlert: () => null,
}))

vi.mock("@/components/link-orphan-file-dialog", () => ({
  LinkOrphanFileDialog: () => null,
}))

vi.mock("@/components/attachment-cell", () => ({
  AttachmentCell: () => null,
}))

vi.mock("@/lib/use-data", () => ({
  useData: () => ({
    activeStorage: { name: "Test", url: "https://github.com/test/repo" },
    companyName: "Test Co",
    getFileUrl: vi.fn(),
    isDirtyFile: vi.fn().mockReturnValue(false),
    getEditingFile: vi.fn().mockReturnValue(null),
    setEditingFile: vi.fn(),
  }),
}))

vi.mock("@/lib/use-storage-data", () => ({
  useStorageData: () => ({
    content: [
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
    ],
    isPending: false,
    error: null,
  }),
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
})
