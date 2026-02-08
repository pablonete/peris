"use client"

import { useStorageQuarters } from "@/lib/use-storage-quarters"
import { useStorageData } from "@/lib/use-storage-data"
import { formatCurrency } from "@/lib/ledger-utils"
import type { ViewType } from "@/components/ledger-sidebar"
import { useLanguage } from "@/lib/i18n-context"

interface WelcomeViewProps {
  onNavigate: (quarter: string, view: ViewType) => void
}

interface QuarterCardProps {
  qId: string
  onNavigate: (quarter: string, view: ViewType) => void
}

function useQuarterSummary(qId: string) {
  const invoicesQuery = useStorageData(qId, "invoices")
  const expensesQuery = useStorageData(qId, "expenses")
  const cashflowQuery = useStorageData(qId, "cashflow")

  const loading =
    invoicesQuery.isPending ||
    expensesQuery.isPending ||
    cashflowQuery.isPending

  if (
    loading ||
    !invoicesQuery.content ||
    !expensesQuery.content ||
    !cashflowQuery.content
  ) {
    return null
  }

  const totalInvoiced = invoicesQuery.content.reduce(
    (sum, inv) => sum + inv.total,
    0
  )
  const totalExpenses = expensesQuery.content.reduce(
    (sum, exp) => sum + exp.total,
    0
  )
  const closingBalance =
    cashflowQuery.content.entries[cashflowQuery.content.entries.length - 1]
      ?.balance ?? cashflowQuery.content.carryOver
  const net = totalInvoiced - totalExpenses

  return {
    totalInvoiced,
    totalExpenses,
    closingBalance,
    carryOver: cashflowQuery.content.carryOver,
    net,
  }
}

function QuarterCard({ qId, onNavigate }: QuarterCardProps) {
  const { t } = useLanguage()
  const summary = useQuarterSummary(qId)

  if (!summary) {
    return null
  }

  return (
    <div className="rounded-sm border border-border bg-card p-6">
      {/* Quarter header */}
      <div className="mb-4 flex items-baseline justify-between border-b border-dashed border-[hsl(var(--ledger-line))] pb-3">
        <h3 className="font-mono text-lg font-bold tracking-wider text-foreground">
          {qId}
        </h3>
        <span className="font-mono text-xs text-muted-foreground">
          {t("welcome.net")}: {formatCurrency(summary.net)}
        </span>
      </div>

      {/* Figures */}
      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("welcome.invoiced")}
          </p>
          <p className="font-mono text-base font-semibold text-foreground">
            {formatCurrency(summary.totalInvoiced)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("welcome.expenses")}
          </p>
          <p className="font-mono text-base font-semibold text-[hsl(var(--ledger-red))]">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("welcome.opening")}
          </p>
          <p className="font-mono text-sm text-foreground">
            {formatCurrency(summary.carryOver)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("welcome.closing")}
          </p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {formatCurrency(summary.closingBalance)}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-2">
        {(["invoices", "expenses", "cashflow"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(qId, view)}
            className="rounded-sm border border-border bg-secondary/60 px-3 py-1.5 font-mono text-xs capitalize text-secondary-foreground transition-colors hover:bg-secondary"
          >
            {t(`sidebar.${view}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function WelcomeView({ onNavigate }: WelcomeViewProps) {
  const { t } = useLanguage()
  const { quarters } = useStorageQuarters()
  const hasQuarters = quarters.length > 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-3xl font-bold tracking-wide text-foreground">
          {t("welcome.ledgerBook")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {t("welcome.selectQuarter")}
        </p>
      </div>

      {!hasQuarters && (
        <div className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
          {t("welcome.noQuarters")}
        </div>
      )}

      {hasQuarters && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {quarters.map((qId) => (
            <QuarterCard key={qId} qId={qId} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}
