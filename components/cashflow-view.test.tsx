import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CashflowView } from "@/components/cashflow-view"
import { TestProviders } from "@/test/test-utils"

const {
  getEditingFileMock,
  setEditingFileMock,
  setEditingTextFileMock,
  listFilesMock,
  readTextFileMock,
} = vi.hoisted(() => ({
  getEditingFileMock: vi.fn(),
  setEditingFileMock: vi.fn(),
  setEditingTextFileMock: vi.fn(),
  listFilesMock: vi.fn(),
  readTextFileMock: vi.fn(),
}))

vi.mock("@/lib/use-data", () => {
  const data = {
    activeStorage: { name: "Test", url: "https://github.com/test/repo" },
    companyName: "Test Co",
    quarters: ["2025.1Q"],
    categories: [],
    isDirtyFile: vi.fn().mockReturnValue(false),
    getEditingFile: getEditingFileMock,
    setEditingFile: setEditingFileMock,
    setEditingTextFile: setEditingTextFileMock,
    listFiles: listFilesMock,
    readTextFile: readTextFileMock,
  }

  return {
    useData: () => data,
  }
})

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
  beforeEach(() => {
    getEditingFileMock.mockReset()
    setEditingFileMock.mockReset()
    setEditingTextFileMock.mockReset()
    listFilesMock.mockReset()
    readTextFileMock.mockReset()
    listFilesMock.mockResolvedValue(["revolut-feb.csv"])
  })

  it("renders the default cashflow heading and entries", () => {
    renderCashflowView()

    expect(screen.getByText("Flujo de caja")).toBeInTheDocument()
    expect(screen.getByText("Client payment")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Importar" })).toBeInTheDocument()
  })

  it("shows the import dialog without a file preselected", async () => {
    const user = userEvent.setup()

    renderCashflowView()

    await user.click(screen.getByRole("button", { name: "Importar" }))

    expect(await screen.findByText("Tarea: Importar")).toBeInTheDocument()
    expect(screen.getByText("Archivo CSV")).toBeInTheDocument()
    expect(screen.getByText("Selecciona un archivo")).toBeInTheDocument()
  })

  it("lists available CSV files in the import dialog", async () => {
    const user = userEvent.setup()

    renderCashflowView()

    await user.click(screen.getByRole("button", { name: "Importar" }))

    expect(await screen.findByText("revolut-feb.csv")).toBeInTheDocument()
  })
})

function renderCashflowView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <TestProviders>
        <CashflowView quarterId="2025.1Q" />
      </TestProviders>
    </QueryClientProvider>
  )
}
