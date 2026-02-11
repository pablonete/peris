"use client"
import { cn } from "@/lib/utils"
import { useStorageQuarters } from "@/lib/use-storage-quarters"
import { useEditingState } from "@/lib/editing-state-context"
import {
  FileText,
  Receipt,
  ArrowRightLeft,
  ChevronDown,
  BookOpen,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import { StorageSelector } from "./storage-selector"
import { CommitButton } from "./commit-button"
import { ErrorBanner } from "./error-banner"
import { NewQuarterDialog } from "./new-quarter-dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"

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
  const { getEditingFile } = useEditingState()
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())

  const viewItems: { key: ViewType; label: string; icon: typeof FileText }[] = [
    { key: "invoices", label: t("sidebar.invoices"), icon: FileText },
    { key: "expenses", label: t("sidebar.expenses"), icon: Receipt },
    { key: "cashflow", label: t("sidebar.cashflow"), icon: ArrowRightLeft },
  ]

  const quartersByYear = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    quarters.forEach((qId) => {
      const [year] = qId.split(".")
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(qId)
    })
    return grouped
  }, [quarters])

  const sortedYears = useMemo(() => {
    return Object.keys(quartersByYear).sort().reverse()
  }, [quartersByYear])

  const selectedYear = useMemo(() => {
    if (!selectedQuarter) return null
    return selectedQuarter.split(".")[0]
  }, [selectedQuarter])

  useEffect(() => {
    if (selectedYear) {
      setExpandedYears((prev) => new Set([...prev, selectedYear]))
    }
  }, [selectedYear])

  function formatQuarterLabel(qId: string): string {
    const [year, q] = qId.split(".")
    const quarterNum = q.replace("Q", "")
    return `${t(`months.${quarterNum}`)} ${year}`
  }

  function toggleYear(year: string) {
    setExpandedYears((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(year)) {
        newSet.delete(year)
      } else {
        newSet.add(year)
      }
      return newSet
    })
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
            const isYearExpanded = expandedYears.has(year)
            const hasYearEdits = getYearEditStatus(year)

            return (
              <li key={year}>
                {/* Year header */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const firstQuarter =
                        yearQuarters.find((q) => q.endsWith(".Q1")) ||
                        yearQuarters[0]
                      router.push(`/invoices?q=${firstQuarter}`)
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-between rounded-sm px-3 py-2.5 text-left text-sm transition-colors",
                      selectedYear === year
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider">
                      {year}
                      {hasYearEdits && (
                        <span
                          className="h-2 w-2 rounded-full bg-green-600"
                          aria-label="Has unsaved changes"
                        />
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleYear(year)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleYear(year)
                        }
                      }}
                      className="flex items-center"
                      aria-label={
                        isYearExpanded ? `Collapse ${year}` : `Expand ${year}`
                      }
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isYearExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  </button>

                  {/* Quick quarter navigation buttons (when collapsed) */}
                  {!isYearExpanded && (
                    <div className="flex gap-0.5">
                      {yearQuarters.map((qId) => {
                        const [, q] = qId.split(".")
                        const isSelected = selectedQuarter === qId
                        return (
                          <button
                            key={qId}
                            type="button"
                            onClick={() => {
                              router.push(`/invoices?q=${qId}`)
                            }}
                            className={cn(
                              "rounded-sm px-1.5 py-1 text-[10px] font-medium transition-colors",
                              isSelected
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            )}
                          >
                            {q}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Expanded quarters */}
                {isYearExpanded && (
                  <ul className="ml-3 mt-1 flex flex-col gap-1">
                    {yearQuarters.map((qId) => {
                      const isExpanded = selectedQuarter === qId
                      const hasEdits =
                        !!getEditingFile(qId, "invoices") ||
                        !!getEditingFile(qId, "expenses") ||
                        !!getEditingFile(qId, "cashflow")
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
                                  selectedView === key &&
                                  selectedQuarter === qId
                                const isEditing = !!getEditingFile(qId, key)
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
                                      {isEditing && (
                                        <span
                                          className="h-2 w-2 rounded-full bg-green-600"
                                          aria-label="Editing"
                                        />
                                      )}
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
                )}
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
