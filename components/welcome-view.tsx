"use client"

import { useEffect, useState } from "react"
import { loadFileFromQuarter } from "@/lib/github-data"
import { useStorage } from "@/lib/storage-context"
import { useStorageQuarters } from "@/lib/use-storage-quarters"
import type { CashflowFileData } from "@/lib/github-storage"
import type { Expense, Invoice } from "@/lib/types"
import { formatCurrency } from "@/lib/ledger-utils"
import type { ViewType } from "@/components/ledger-sidebar"
import { useLanguage } from "@/lib/i18n-context"

interface WelcomeViewProps {
  onNavigate: (quarter: string, view: ViewType) => void
}

type QuarterSummary = {
  totalInvoiced: number
  totalExpenses: number
  carryOver: number
  closingBalance: number
  net: number
}

export function WelcomeView({ onNavigate }: WelcomeViewProps) {
  const { t } = useLanguage()
  const { activeStorage } = useStorage()
  const { quarters } = useStorageQuarters()
  const [summaries, setSummaries] = useState<Record<string, QuarterSummary>>({})
  const [loading, setLoading] = useState(true)
  const hasQuarters = quarters.length > 0

  useEffect(() => {
    let cancelled = false

    if (quarters.length === 0) {
      setSummaries({})
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    setLoading(true)

    Promise.all(
      quarters.map(async (qId) => {
        const [invoicesResult, expensesResult, cashflowResult] =
          await Promise.all([
            loadFileFromQuarter<Invoice[]>(activeStorage, qId, "invoices"),
            loadFileFromQuarter<Expense[]>(activeStorage, qId, "expenses"),
            loadFileFromQuarter<CashflowFileData>(
              activeStorage,
              qId,
              "cashflow"
            ),
          ])

        if (
          invoicesResult.error ||
          expensesResult.error ||
          cashflowResult.error ||
          !cashflowResult.data
        ) {
          return null
        }

        const invoices = invoicesResult.data || []
        const expenses = expensesResult.data || []
        const cashflow = cashflowResult.data

        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0)
        const closingBalance =
          cashflow.entries[cashflow.entries.length - 1]?.balance ??
          cashflow.carryOver

        return {
          qId,
          summary: {
            totalInvoiced,
            totalExpenses,
            carryOver: cashflow.carryOver,
            closingBalance,
            net: totalInvoiced - totalExpenses,
          },
        }
      })
    )
      .then((results) => {
        if (cancelled) {
          return
        }

        const nextSummaries: Record<string, QuarterSummary> = {}
        results.forEach((result) => {
          if (!result) {
            return
          }
          nextSummaries[result.qId] = result.summary
        })

        setSummaries(nextSummaries)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setSummaries({})
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeStorage, quarters])

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

      {loading && (
        <div className="text-sm text-muted-foreground">
          {t("welcome.loading")}
        </div>
      )}

      {!loading && !hasQuarters && (
        <div className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
          {t("welcome.noQuarters")}
        </div>
      )}

      {!loading && hasQuarters && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {quarters.map((qId) => {
            const summary = summaries[qId]
            if (!summary) return null
            return (
              <div
                key={qId}
                className="rounded-sm border border-border bg-card p-6"
              >
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
                  {(["invoices", "expenses", "cashflow"] as const).map(
                    (view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => onNavigate(qId, view)}
                        className="rounded-sm border border-border bg-secondary/60 px-3 py-1.5 font-mono text-xs capitalize text-secondary-foreground transition-colors hover:bg-secondary"
                      >
                        {t(`sidebar.${view}`)}
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
