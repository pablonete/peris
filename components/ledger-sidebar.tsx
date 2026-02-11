"use client"
import { cn } from "@/lib/utils"
import { useStorageQuarters } from "@/lib/use-storage-quarters"
import { useEditingState } from "@/lib/editing-state-context"
import { FileText, Receipt, ArrowRightLeft, BookOpen } from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import { StorageSelector } from "./storage-selector"
import { CommitButton } from "./commit-button"
import { ErrorBanner } from "./error-banner"
import { NewQuarterDialog } from "./new-quarter-dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"

export type ViewType = "invoices" | "expenses" | "cashflow"

interface LedgerSidebarProps {
  selectedQuarter: string
  selectedView: ViewType | null
  onSidebarClose?: () => void
}

function groupQuartersByYear(quarters: string[]) {
  const grouped: Record<string, string[]> = {}
  quarters.forEach((qId) => {
    const [year] = qId.split(".")
    if (!grouped[year]) grouped[year] = []
    grouped[year].push(qId)
  })
  return grouped
}

function getSortedYears(quartersByYear: Record<string, string[]>) {
  return Object.keys(quartersByYear).sort().reverse()
}

function extractYearFromQuarterId(qId: string): string {
  return qId.split(".")[0]
}

export function LedgerSidebar({
  selectedQuarter,
  selectedView,
  onSidebarClose,
}: LedgerSidebarProps) {
  const { language, setLanguage, t } = useLanguage()
  const router = useRouter()
  const { quarters, error: quartersError } = useStorageQuarters()
  const { getEditingFile } = useEditingState()

  const viewItems: { key: ViewType; label: string; icon: typeof FileText }[] = [
    { key: "invoices", label: t("sidebar.invoices"), icon: FileText },
    { key: "expenses", label: t("sidebar.expenses"), icon: Receipt },
    { key: "cashflow", label: t("sidebar.cashflow"), icon: ArrowRightLeft },
  ]

  const quartersByYear = groupQuartersByYear(quarters)
  const sortedYears = getSortedYears(quartersByYear)
  const selectedYear = selectedQuarter
    ? extractYearFromQuarterId(selectedQuarter)
    : null

  function formatQuarterLabel(qId: string): string {
    const [year, q] = qId.split(".")
    const quarterNum = q.replace("Q", "")
    return `${t(`months.${quarterNum}`)} ${year}`
  }

  function getYearEditStatus(year: string) {
    const yearQuarters = quartersByYear[year] || []
    return yearQuarters.some(
      (qId) =>
        !!getEditingFile(qId, "invoices") ||
        !!getEditingFile(qId, "expenses") ||
        !!getEditingFile(qId, "cashflow")
    )
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5 transition-colors hover:bg-sidebar-accent/80">
        <Link href="/" className="flex items-center gap-3 rounded-sm px-1 py-1">
          <BookOpen className="h-6 w-6 text-sidebar-primary" />
          <div>
            <h1 className="text-lg font-bold tracking-wide text-sidebar-primary">
              {t("sidebar.ledgerBook")}
            </h1>
            <p className="font-mono text-xs text-sidebar-foreground/60">
              {t("sidebar.accounting")}
            </p>
          </div>
        </Link>
      </div>

      {/* Quarter navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50">
            {t("sidebar.quarters")}
          </p>
          <NewQuarterDialog existingQuarters={quarters} />
        </div>
        {quartersError && (
          <ErrorBanner
            title={t("sidebar.errorLoadingQuarters")}
            message={quartersError.message}
            className="mb-3"
          />
        )}
        <ul className="flex flex-col gap-1">
          {sortedYears.map((year) => {
            const yearQuarters = quartersByYear[year]
            const isYearSelected = selectedYear === year
            const hasYearEdits = getYearEditStatus(year)

            if (!isYearSelected) {
              return (
                <li key={year}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const firstQuarter =
                          yearQuarters.find((q) => q.endsWith(".Q1")) ||
                          yearQuarters[0]
                        router.push(`/invoices?q=${firstQuarter}`)
                      }}
                      className="flex flex-1 items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm transition-colors text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    >
                      <span className="font-mono text-xs font-semibold tracking-wider">
                        {year}
                      </span>
                      {hasYearEdits && (
                        <span
                          className="h-2 w-2 rounded-full bg-green-600"
                          aria-label="Has unsaved changes"
                        />
                      )}
                    </button>
                    <div className="flex gap-0.5">
                      {yearQuarters.map((qId) => {
                        const [, q] = qId.split(".")
                        return (
                          <button
                            key={qId}
                            type="button"
                            onClick={() => {
                              router.push(`/invoices?q=${qId}`)
                            }}
                            className="rounded-sm px-1.5 py-1 text-[10px] font-medium transition-colors text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            title={formatQuarterLabel(qId)}
                          >
                            {q}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </li>
              )
            }

            return (
              <li key={year}>
                <ul className="flex flex-col gap-1">
                  {yearQuarters.map((qId) => {
                    const isQuarterSelected = selectedQuarter === qId
                    const hasEdits =
                      !!getEditingFile(qId, "invoices") ||
                      !!getEditingFile(qId, "expenses") ||
                      !!getEditingFile(qId, "cashflow")
                    return (
                      <li key={qId}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              router.push(`/invoices?q=${qId}`)
                            }}
                            className={cn(
                              "flex flex-1 items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm transition-colors",
                              isQuarterSelected
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <span className="flex flex-col">
                              <span className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider">
                                {qId}
                                {hasEdits && (
                                  <span
                                    className="h-2 w-2 rounded-full bg-green-600"
                                    aria-label="Has unsaved changes"
                                  />
                                )}
                              </span>
                              <span className="text-[11px] text-sidebar-foreground/50">
                                {formatQuarterLabel(qId)}
                              </span>
                            </span>
                          </button>
                          <div className="flex gap-0.5">
                            {viewItems.map(({ key, icon: Icon }) => {
                              const isActive =
                                selectedView === key && selectedQuarter === qId
                              const isEditing = !!getEditingFile(qId, key)
                              return (
                                <Link
                                  key={key}
                                  href={`/${key}?q=${qId}`}
                                  onClick={onSidebarClose}
                                  className={cn(
                                    "relative flex items-center justify-center rounded-sm p-1.5 transition-colors",
                                    isActive
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                                  )}
                                  title={t(`sidebar.${key}`)}
                                >
                                  <Icon className="h-4 w-4" />
                                  {isEditing && (
                                    <span
                                      className="absolute -mt-2 -mr-2 h-1.5 w-1.5 rounded-full bg-green-600"
                                      aria-label="Editing"
                                    />
                                  )}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </nav>

      <CommitButton />
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
