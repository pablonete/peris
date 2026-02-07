"use client"

import { useState } from "react"
import { LedgerSidebar, type ViewType } from "@/components/ledger-sidebar"
import { InvoicesView } from "@/components/invoices-view"
import { ExpensesView } from "@/components/expenses-view"
import { CashflowView } from "@/components/cashflow-view"
import { WelcomeView } from "@/components/welcome-view"
import { quarterIds } from "@/lib/sample-data"
import { Menu, X } from "lucide-react"

export default function Home() {
  const [selectedQuarter, setSelectedQuarter] = useState(quarterIds[0])
  const [selectedView, setSelectedView] = useState<ViewType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleSelectQuarter(q: string) {
    if (selectedQuarter === q) {
      // Toggle collapse if clicking same quarter
      return
    }
    setSelectedQuarter(q)
    setSelectedView(null)
  }

  function handleSelectView(q: string, v: ViewType) {
    setSelectedQuarter(q)
    setSelectedView(v)
    setSidebarOpen(false)
  }

  function renderContent() {
    if (!selectedView) {
      return <WelcomeView onNavigate={handleSelectView} />
    }
    switch (selectedView) {
      case "invoices":
        return <InvoicesView quarterId={selectedQuarter} />
      case "expenses":
        return <ExpensesView quarterId={selectedQuarter} />
      case "cashflow":
        return <CashflowView quarterId={selectedQuarter} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <LedgerSidebar
          selectedQuarter={selectedQuarter}
          selectedView={selectedView}
          onSelectQuarter={handleSelectQuarter}
          onSelectView={handleSelectView}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="flex items-center border-b border-border bg-card px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="mr-3 rounded-sm p-1 text-foreground hover:bg-secondary"
            aria-label="Open sidebar"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
            Ledger Book
          </span>
        </div>

        {/* Decorative ruled-line background + content */}
        <div
          className="min-h-full px-6 py-8 lg:px-10 lg:py-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent, transparent 31px, hsl(30 15% 80% / 0.4) 31px, hsl(30 15% 80% / 0.4) 32px)",
            backgroundSize: "100% 32px",
          }}
        >
          {/* Red margin line like a real ledger page */}
          <div
            className="relative"
            style={{
              borderLeft: "2px solid hsl(0 60% 38% / 0.2)",
              paddingLeft: "1.5rem",
            }}
          >
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  )
}
