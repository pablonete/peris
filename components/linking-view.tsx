"use client"

import { useStorageData } from "@/lib/use-storage-data"
import { useLanguage } from "@/lib/i18n-context"
import { ErrorBanner } from "@/components/error-banner"
import { Invoice, Expense } from "@/lib/types"
import { buildLinkingRows } from "@/lib/linking-utils"
import { cn } from "@/lib/utils"
import { InvoiceLinkingCell } from "@/components/invoices/invoice-linking-cell"
import { ExpenseLinkingCell } from "@/components/expenses/expense-linking-cell"
import { CashflowLinkingCell } from "@/components/cashflow/cashflow-linking-cell"

interface LinkingViewProps {
  quarterId: string
}

export function LinkingView({ quarterId }: LinkingViewProps) {
  const { t } = useLanguage()

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

  const rows = buildLinkingRows(cashflow ?? [], invoices ?? [], expenses ?? [])

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          {t("linking.title")}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">{quarterId}</p>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="flex border-b-2 border-foreground/15">
          <div className="flex-1 border-r border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("linking.items")}
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
                  {row.item && row.itemType === "invoices" && (
                    <InvoiceLinkingCell
                      invoice={row.item as Invoice}
                      quarterId={quarterId}
                    />
                  )}
                  {row.item && row.itemType === "expenses" && (
                    <ExpenseLinkingCell
                      expense={row.item as Expense}
                      quarterId={quarterId}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    "flex-1 px-3 min-h-[3.5rem]",
                    !row.cashflow && "bg-secondary/10"
                  )}
                >
                  {row.cashflow && <CashflowLinkingCell entry={row.cashflow} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
