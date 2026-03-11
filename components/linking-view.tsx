"use client"

import { useState } from "react"
import { FileText, Receipt } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useStorageData } from "@/lib/use-storage-data"
import { useLanguage } from "@/lib/i18n-context"
import { ErrorBanner } from "@/components/error-banner"
import { Button } from "@/components/ui/button"
import { Invoice, Expense, CashflowEntry } from "@/lib/types"
import { buildLinkingRows, LinkedSide } from "@/lib/linking-utils"
import { cn } from "@/lib/utils"

interface LinkingViewProps {
  quarterId: string
}

function InvoiceCell({ invoice }: { invoice: Invoice }) {
  return (
    <div className="py-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          {formatDate(invoice.date)}
        </span>
        <span className="font-mono text-xs font-semibold text-[hsl(var(--ledger-green))] shrink-0">
          {formatCurrency(invoice.total)}
        </span>
      </div>
      <div className="text-sm truncate text-muted-foreground">
        {invoice.client} — {invoice.concept}
      </div>
    </div>
  )
}

function ExpenseCell({ expense }: { expense: Expense }) {
  return (
    <div className="py-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          {formatDate(expense.date)}
        </span>
        <span className="font-mono text-xs font-semibold text-[hsl(var(--ledger-red))] shrink-0">
          {formatCurrency(expense.total)}
        </span>
      </div>
      <div className="text-sm truncate text-muted-foreground">
        {expense.vendor} — {expense.concept}
      </div>
    </div>
  )
}

function CashflowCell({ entry }: { entry: CashflowEntry }) {
  const isIncome = entry.income != null
  return (
    <div className="py-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          {formatDate(entry.date)}
        </span>
        <span
          className={cn(
            "font-mono text-xs font-semibold shrink-0",
            isIncome
              ? "text-[hsl(var(--ledger-green))]"
              : "text-[hsl(var(--ledger-red))]"
          )}
        >
          {isIncome
            ? formatCurrency(entry.income!)
            : formatCurrency(entry.expense ?? entry.balance)}
        </span>
      </div>
      <div className="text-sm truncate text-muted-foreground">
        {entry.concept}
      </div>
    </div>
  )
}

export function LinkingView({ quarterId }: LinkingViewProps) {
  const { t } = useLanguage()
  const [side, setSide] = useState<LinkedSide>("expenses")

  const {
    content: invoices,
    isPending: invoicesPending,
    error: invoicesError,
  } = useStorageData(quarterId, "invoices")
  const {
    content: expenses,
    isPending: expensesPending,
    error: expensesError,
  } = useStorageData(quarterId, "expenses")
  const {
    content: cashflow,
    isPending: cashflowPending,
    error: cashflowError,
  } = useStorageData(quarterId, "cashflow")

  const isPending = invoicesPending || expensesPending || cashflowPending
  const error = invoicesError || expensesError || cashflowError

  if (isPending) {
    return (
      <div className="text-center text-muted-foreground">
        {t("linking.title")}...
      </div>
    )
  }

  if (error) {
    return <ErrorBanner title={t("linking.title")} message={error.message} />
  }

  const items = side === "invoices" ? (invoices ?? []) : (expenses ?? [])
  const cashflowEntries = cashflow ?? []

  const rows = buildLinkingRows(cashflowEntries, items, side)

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          {t("linking.title")}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">{quarterId}</p>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          variant={side === "invoices" ? "default" : "outline"}
          size="sm"
          onClick={() => setSide("invoices")}
        >
          <FileText className="mr-2 h-4 w-4" />
          {t("linking.invoices")}
        </Button>
        <Button
          variant={side === "expenses" ? "default" : "outline"}
          size="sm"
          onClick={() => setSide("expenses")}
        >
          <Receipt className="mr-2 h-4 w-4" />
          {t("linking.expenses")}
        </Button>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="flex border-b-2 border-foreground/15">
          <div className="flex-1 border-r border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {side === "invoices"
              ? t("linking.invoices")
              : t("linking.expenses")}
          </div>
          <div className="flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("linking.cashflow")}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("linking.emptyState")}
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-[hsl(var(--ledger-line))]">
            {rows.map((row, idx) => (
              <div
                key={row.cashflow?.id ?? row.item?.id ?? idx}
                className="flex"
              >
                <div
                  className={cn(
                    "flex-1 border-r border-border px-3 min-h-[3.5rem]",
                    !row.item && "bg-secondary/10"
                  )}
                >
                  {row.item &&
                    (side === "invoices" ? (
                      <InvoiceCell invoice={row.item as Invoice} />
                    ) : (
                      <ExpenseCell expense={row.item as Expense} />
                    ))}
                </div>
                <div
                  className={cn(
                    "flex-1 px-3 min-h-[3.5rem]",
                    !row.cashflow && "bg-secondary/10"
                  )}
                >
                  {row.cashflow && <CashflowCell entry={row.cashflow} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
