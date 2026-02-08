"use client"
import { cn } from "@/lib/utils"
import { useStorageQuarters } from "@/lib/use-storage-quarters"
import {
  FileText,
  Receipt,
  ArrowRightLeft,
  ChevronDown,
  BookOpen,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import { StorageSelector } from "./storage-selector"
import { ErrorBanner } from "./error-banner"
import Link from "next/link"
import { useRouter } from "next/navigation"

export type ViewType = "invoices" | "expenses" | "cashflow"

interface LedgerSidebarProps {
  selectedQuarter: string
  selectedView: ViewType | null
  onSidebarClose?: () => void
}

export function LedgerSidebar({
  selectedQuarter,
  selectedView,
  onSidebarClose,
}: LedgerSidebarProps) {
  const { language, setLanguage, t } = useLanguage()
  const router = useRouter()
  const { quarters, error: quartersError } = useStorageQuarters()

  const viewItems: { key: ViewType; label: string; icon: typeof FileText }[] = [
    { key: "invoices", label: t("sidebar.invoices"), icon: FileText },
    { key: "expenses", label: t("sidebar.expenses"), icon: Receipt },
    { key: "cashflow", label: t("sidebar.cashflow"), icon: ArrowRightLeft },
  ]

  function formatQuarterLabel(qId: string): string {
    const [year, q] = qId.split(".")
    const quarterNum = q.replace("Q", "")
    return `${t(`months.${quarterNum}`)} ${year}`
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <BookOpen className="h-6 w-6 text-sidebar-primary" />
        <div>
          <h1 className="text-lg font-bold tracking-wide text-sidebar-primary">
            {t("sidebar.ledgerBook")}
          </h1>
          <p className="font-mono text-xs text-sidebar-foreground/60">
            {t("sidebar.accounting")}
          </p>
        </div>
      </div>

      {/* Quarter navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50">
          {t("sidebar.quarters")}
        </p>
        {quartersError && (
          <ErrorBanner
            title={t("sidebar.errorLoadingQuarters")}
            message={quartersError.message}
            className="mb-3"
          />
        )}
        <ul className="flex flex-col gap-1">
          {quarters.map((qId) => {
            const isExpanded = selectedQuarter === qId
            return (
              <li key={qId}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/invoices?q=${qId}`)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-left text-sm transition-colors",
                    isExpanded
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className="flex flex-col">
                    <span className="font-mono text-xs font-semibold tracking-wider">
                      {qId}
                    </span>
                    <span className="text-[11px] text-sidebar-foreground/50">
                      {formatQuarterLabel(qId)}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Sub-items */}
                {isExpanded && (
                  <ul className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                    {viewItems.map(({ key, label, icon: Icon }) => {
                      const isActive =
                        selectedView === key && selectedQuarter === qId
                      return (
                        <li key={key}>
                          <Link
                            href={`/${key}?q=${qId}`}
                            onClick={onSidebarClose}
                            className={cn(
                              "flex items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <StorageSelector />

      <div className="border-t border-sidebar-border px-5 py-3">
        <div className="flex justify-center gap-2 font-mono text-xs">
          <button
            onClick={() => setLanguage("es")}
            className={cn(
              "px-2 py-1 rounded transition-colors",
              language === "es"
                ? "text-sidebar-accent-foreground bg-sidebar-accent"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
            )}
          >
            ES
          </button>
          <span className="text-sidebar-foreground/30">|</span>
          <button
            onClick={() => setLanguage("en")}
            className={cn(
              "px-2 py-1 rounded transition-colors",
              language === "en"
                ? "text-sidebar-accent-foreground bg-sidebar-accent"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
            )}
          >
            EN
          </button>
        </div>
      </div>
    </aside>
  )
}
