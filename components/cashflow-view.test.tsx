import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CashflowView } from "@/components/cashflow-view"
import { TestProviders } from "@/test/test-utils"

vi.mock("@/lib/github-data", () => ({
  listRootFolderFiles: vi.fn().mockResolvedValue(["revolut-feb.csv"]),
  loadRootTextFile: vi.fn(),
}))

vi.mock("@/lib/use-data", () => ({
  useData: () => ({
    activeStorage: { name: "Test", url: "https://github.com/test/repo" },
    companyName: "Test Co",
    quarters: ["2025.1Q"],
    categories: [],
    isDirtyFile: vi.fn().mockReturnValue(false),
    getEditingFile: vi.fn(),
    setEditingFile: vi.fn(),
    setEditingRootTextFile: vi.fn(),
  }),
}))

vi.mock("@/lib/use-storage-data", () => ({
  useStorageData: () => ({
    content: [
      {
        id: "1",
        date: "2025-01-01",
        concept: "Carry over",
        balance: 5000,
      },
      {
        id: "2",
        date: "2025-01-15",
        concept: "Client payment",
        income: 1210,
        balance: 6210,
      },
    ],
    isPending: false,
    error: null,
  }),
  useFileSha: () => "sha-1",
}))

describe("CashflowView", () => {
  it("renders the cashflow heading, entries, and import task dialog", async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <TestProviders>
          <CashflowView quarterId="2025.1Q" />
        </TestProviders>
      </QueryClientProvider>
    )

    expect(screen.getByText("Flujo de caja")).toBeInTheDocument()
    expect(screen.getByText("Client payment")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Importar" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Importar" }))

    expect(await screen.findByText("Tarea: Importar")).toBeInTheDocument()
    expect(screen.getByText("Archivo CSV")).toBeInTheDocument()
  })
})
