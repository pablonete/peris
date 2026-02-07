"use client"

import { quarterIds, getQuarterSummary, formatCurrency } from "@/lib/sample-data"
import type { ViewType } from "@/components/ledger-sidebar"

interface WelcomeViewProps {
  onNavigate: (quarter: string, view: ViewType) => void
}

export function WelcomeView({ onNavigate }: WelcomeViewProps) {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-3xl font-bold tracking-wide text-foreground">
          Ledger Book
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Select a quarter from the sidebar, or browse the overview below.
        </p>
      </div>

      {/* Quarter overview cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {quarterIds.map((qId) => {
          const summary = getQuarterSummary(qId)
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
                  Net: {formatCurrency(summary.net)}
                </span>
              </div>

              {/* Figures */}
              <div className="mb-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Invoiced
                  </p>
                  <p className="font-mono text-base font-semibold text-foreground">
                    {formatCurrency(summary.totalInvoiced)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Expenses
                  </p>
                  <p className="font-mono text-base font-semibold text-[hsl(var(--ledger-red))]">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Opening
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {formatCurrency(summary.carryOver)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Closing
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
                    {view}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
