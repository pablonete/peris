"use client"

import { FileText, Paperclip, Receipt } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useStorageData } from "@/lib/use-storage-data"
import { useLanguage } from "@/lib/i18n-context"
import { useData } from "@/lib/use-data"
import { ErrorBanner } from "@/components/error-banner"
import { Invoice, Expense, CashflowEntry } from "@/lib/types"
import { buildLinkingRows } from "@/lib/linking-utils"
import { getFileUrl } from "@/lib/storage-types"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface LinkingViewProps {
  quarterId: string
}

interface InvoiceCellProps {
  invoice: Invoice
  storageUrl: string
  quarterId: string
}

function InvoiceCell({ invoice, storageUrl, quarterId }: InvoiceCellProps) {
  return (
    <div className="py-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          {formatDate(invoice.date)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {invoice.filename && (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={getFileUrl(
                    storageUrl,
                    quarterId,
                    "invoices",
                    invoice.filename
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Paperclip className="h-3 w-3" />
                </a>
              </TooltipTrigger>
              <TooltipContent>{invoice.filename}</TooltipContent>
            </Tooltip>
          )}
          <FileText className="h-3 w-3 text-[hsl(var(--ledger-green))] shrink-0" />
          <span className="font-mono text-xs font-semibold text-[hsl(var(--ledger-green))]">
            {formatCurrency(invoice.total)}
          </span>
        </div>
      </div>
      <div className="text-sm truncate text-muted-foreground">
        {invoice.client} — {invoice.concept}
      </div>
    </div>
  )
}

interface ExpenseCellProps {
  expense: Expense
  storageUrl: string
  quarterId: string
}

function ExpenseCell({ expense, storageUrl, quarterId }: ExpenseCellProps) {
  return (
    <div className="py-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          {formatDate(expense.date)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {expense.filename && (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={getFileUrl(
                    storageUrl,
                    quarterId,
                    "expenses",
                    expense.filename
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Paperclip className="h-3 w-3" />
                </a>
              </TooltipTrigger>
              <TooltipContent>{expense.filename}</TooltipContent>
            </Tooltip>
          )}
          <Receipt className="h-3 w-3 text-[hsl(var(--ledger-red))] shrink-0" />
          <span className="font-mono text-xs font-semibold text-[hsl(var(--ledger-red))]">
            {formatCurrency(expense.total)}
          </span>
        </div>
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
  const { activeStorage } = useData()

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

  const storageUrl = activeStorage?.url ?? ""

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
                  {row.item && row.itemSide === "invoices" && (
                    <InvoiceCell
                      invoice={row.item as Invoice}
                      storageUrl={storageUrl}
                      quarterId={quarterId}
                    />
                  )}
                  {row.item && row.itemSide === "expenses" && (
                    <ExpenseCell
                      expense={row.item as Expense}
                      storageUrl={storageUrl}
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
