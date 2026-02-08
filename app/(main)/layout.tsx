"use client"

import { useState } from "react"
import { LedgerSidebar } from "@/components/ledger-sidebar"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Extract current quarter and view from pathname
  function getCurrentQuarterAndView(): [string, string | null] {
    const segments = pathname.split("/").filter(Boolean)
    const quarterPattern = /^\d{4}\.\d[QqTt]$/

    // Handle /2025.4Q/invoices -> quarter = 2025.4Q, view = invoices
    if (segments.length >= 2 && quarterPattern.test(segments[0])) {
      const quarter = segments[0]
      const view = segments[1]
      if (view === "invoices" || view === "expenses" || view === "cashflow") {
        return [quarter, view]
      }
    }

    // Default to first quarter, no view selected (welcome page)
    return ["", null]
  }

  const [selectedQuarter, selectedView] = getCurrentQuarterAndView()

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
          selectedView={
            selectedView as "invoices" | "expenses" | "cashflow" | null
          }
          onSidebarClose={() => setSidebarOpen(false)}
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
            Peris
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
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
