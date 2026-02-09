"use client"

import { Suspense, useState } from "react"
import { LedgerSidebar, ViewType } from "@/components/ledger-sidebar"
import { ErrorBanner } from "@/components/error-banner"
import { useEditingState } from "@/lib/editing-state-context"
import { useLanguage } from "@/lib/i18n-context"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

function MainLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { error } = useEditingState()
  const { t } = useLanguage()

  const selectedQuarter = searchParams.get("q") || ""
  const segments = pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  const selectedView = (
    ["invoices", "expenses", "cashflow"].includes(lastSegment ?? "")
      ? lastSegment
      : null
  ) as ViewType | null

  return (
    <div className="flex h-screen overflow-hidden">
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

      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <LedgerSidebar
          selectedQuarter={selectedQuarter}
          selectedView={selectedView}
          onSidebarClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 overflow-y-auto">
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
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-wider text-foreground"
          >
            Peris
          </Link>
        </div>

        <div
          className="min-h-full px-6 py-8 lg:px-10 lg:py-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent, transparent 31px, hsl(30 15% 80% / 0.4) 31px, hsl(30 15% 80% / 0.4) 32px)",
            backgroundSize: "100% 32px",
          }}
        >
          <div
            className="relative"
            style={{
              borderLeft: "2px solid hsl(0 60% 38% / 0.2)",
              paddingLeft: "1.5rem",
            }}
          >
            {error && (
              <ErrorBanner
                title={t("storage.error.saving")}
                message={error}
                className="mb-6"
              />
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense>
      <MainLayoutInner>{children}</MainLayoutInner>
    </Suspense>
  )
}
