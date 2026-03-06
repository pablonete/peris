"use client"

import { Suspense, useState } from "react"
import { LedgerSidebar, ViewType } from "@/components/ledger-sidebar"
import { ErrorBanner } from "@/components/error-banner"
import { useEditingState } from "@/lib/editing-state-context"
import { useData } from "@/lib/use-data"
import { useLanguage } from "@/lib/i18n-context"
import { cn } from "@/lib/utils"
import { FileText, Receipt, ArrowRightLeft, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

function LayoutContent({
  children,
  sidebarOpen,
  setSidebarOpen,
}: {
  children: React.ReactNode
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}) {
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

  const { getEditingFile } = useData()
  const viewTabs: { key: ViewType; label: string; icon: typeof FileText }[] = [
    { key: "invoices", label: t("sidebar.invoices"), icon: FileText },
    { key: "expenses", label: t("sidebar.expenses"), icon: Receipt },
    { key: "cashflow", label: t("sidebar.cashflow"), icon: ArrowRightLeft },
  ]

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
        />
      </div>

      <main className="flex flex-col flex-1 min-h-0">
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

        {selectedQuarter && (
          <div className="flex border-b border-border bg-card px-2 shrink-0">
            {viewTabs.map(({ key, label, icon: Icon }) => {
              const isActive = selectedView === key
              const isEditing = !!getEditingFile(selectedQuarter, key)
              return (
                <Link
                  key={key}
                  href={`/${key}?q=${selectedQuarter}`}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {isEditing && (
                    <span
                      className="h-2 w-2 rounded-full bg-[hsl(var(--ledger-blue))]"
                      aria-label="Has unsaved changes"
                    />
                  )}
                </Link>
              )
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Suspense fallback={<div className="flex h-screen bg-background" />}>
      <LayoutContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
        {children}
      </LayoutContent>
    </Suspense>
  )
}
