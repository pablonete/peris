"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useStorageData } from "@/lib/use-storage-data"
import { useStorage } from "@/lib/storage-context"
import { useEditingState } from "@/lib/editing-state-context"
import { Expense } from "@/lib/types"
import { getVatSubtotals } from "@/lib/vat-subtotals"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaymentDateCell } from "@/components/payment-date-cell"
import { AttachmentCell } from "@/components/attachment-cell"
import { ErrorBanner } from "@/components/error-banner"
import { SummaryCard } from "@/components/summary-card"
import {
  NewExpenseDialog,
  DuplicateExpenseDialog,
} from "@/components/new-expense-dialog"
import { ExpenseRowActions } from "@/components/expense-row-actions"
import { DeleteExpenseAlert } from "@/components/delete-expense-alert"
import { useLanguage } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"

interface ExpensesViewProps {
  quarterId: string
}

export function ExpensesView({ quarterId }: ExpensesViewProps) {
  const { t } = useLanguage()
  const { activeStorage } = useStorage()
  const { getEditingFile, setEditingFile } = useEditingState()
  const { content, isPending, error } = useStorageData(quarterId, "expenses")
  const isEditing = !!getEditingFile(quarterId, "expenses")
  const [deleteAlert, setDeleteAlert] = useState<string | null>(null)
  const [duplicateExpense, setDuplicateExpense] = useState<Expense | null>(null)
  const [showVatSubtotals, setShowVatSubtotals] = useState(false)

  if (isPending) {
    return (
      <div className="text-center text-muted-foreground">
        {t("expenses.expenses")}...
      </div>
    )
  }

  if (error) {
    return <ErrorBanner title={t("sidebar.expenses")} message={error.message} />
  }

  const expenses = content || []
  const totalSubtotal = expenses.reduce(
    (s, e) => s + e.vat.reduce((v, item) => v + item.subtotal, 0),
    0
  )
  const totalVat = expenses.reduce(
    (s, e) => s + e.vat.reduce((v, item) => v + item.amount, 0),
    0
  )
  const totalTaxRetention = expenses.reduce(
    (s, e) => s + (e.taxRetention || 0),
    0
  )
  const totalExpensesAmount = expenses.reduce((s, e) => s + e.total, 0)
  const paidExpenses = expenses
    .filter((e) => e.paymentDate != null)
    .reduce((s, e) => s + e.total, 0)
  const pendingExpenses = expenses
    .filter((e) => e.paymentDate == null)
    .reduce((s, e) => s + e.total, 0)

  const vatSubtotals = getVatSubtotals(expenses)

  const handleDeleteExpense = (id: string) => {
    const nextExpenses = expenses.filter((e) => e.id !== id)
    const editingFile = getEditingFile(quarterId, "expenses")
    setEditingFile(quarterId, "expenses", nextExpenses, editingFile?.sha)
    setDeleteAlert(null)
  }

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-foreground">
            {t("expenses.expenses")}
            {isEditing && (
              <span
                className="h-2 w-2 rounded-full bg-[hsl(var(--ledger-blue))]"
                aria-label="Editing"
              />
            )}
          </h2>
          <NewExpenseDialog quarterId={quarterId} expenses={expenses} />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {quarterId} &middot; {activeStorage.name} &middot; {expenses.length}{" "}
          {t("expenses.entries")}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label={t("expenses.totalExpenses")}
          value={totalExpensesAmount}
        />
        <SummaryCard label={t("expenses.paid")} value={paidExpenses} />
        <SummaryCard label={t("expenses.pending")} value={pendingExpenses} />
      </div>

      <div className="rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-foreground/15 hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                {t("expenses.date")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Invoice
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Vendor
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                {t("expenses.description")}
              </TableHead>
              <TableHead className="w-[40px]" />
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Subtotal
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                VAT
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                IRPF
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Total
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-center">
                Payment
              </TableHead>
              <TableHead className="w-[40px] text-center" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-6">
                  {t("expenses.emptyState")}
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow
                  key={exp.id}
                  className="border-b border-dashed border-[hsl(var(--ledger-line))] hover:bg-secondary/50"
                >
                  <TableCell className="font-mono text-xs">
                    {formatDate(exp.date)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {exp.number ?? (
                      <span className="text-muted-foreground/50">
                        {"\u2014"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{exp.vendor}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {exp.concept}
                  </TableCell>
                  <TableCell className="text-center">
                    <AttachmentCell
                      storage={activeStorage}
                      quarterId={quarterId}
                      type="expenses"
                      filename={exp.filename}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    {exp.vat.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {exp.vat.map((vat, idx) => (
                          <div key={`${vat.rate}-${vat.subtotal}`}>
                            {formatCurrency(vat.subtotal)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      formatCurrency(exp.total)
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    {exp.vat.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {exp.vat.map((vat, idx) => (
                          <div
                            key={`${vat.rate}-${vat.subtotal}`}
                            className="flex items-baseline justify-end gap-1"
                          >
                            <span className="text-[9px] text-muted-foreground/60">
                              {vat.rate}%
                            </span>
                            <span>{formatCurrency(vat.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "\u2014"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    {exp.taxRetention
                      ? formatCurrency(exp.taxRetention)
                      : "\u2014"}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold text-right text-[hsl(var(--ledger-red))]">
                    {formatCurrency(exp.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <PaymentDateCell paymentDate={exp.paymentDate} variant="expense" />
                  </TableCell>
                  <TableCell className="text-center">
                    <ExpenseRowActions
                      expense={exp}
                      onDuplicate={setDuplicateExpense}
                      onDelete={setDeleteAlert}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="border-t-2 border-foreground/20 bg-secondary/30 hover:bg-secondary/30">
              <TableCell colSpan={5} className="font-semibold text-sm">
                {t("invoices.total")}s
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right">
                {formatCurrency(totalSubtotal)}
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right">
                {formatCurrency(totalVat)}
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right">
                {formatCurrency(totalTaxRetention)}
              </TableCell>
              <TableCell className="font-mono text-sm font-bold text-right text-[hsl(var(--ledger-red))]">
                {formatCurrency(totalExpensesAmount)}
              </TableCell>
              <TableCell />
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVatSubtotals(!showVatSubtotals)}
                  className="h-6 px-2 text-[10px] font-mono"
                >
                  {showVatSubtotals ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {t("expenses.vatSubtotal")}
                </Button>
              </TableCell>
            </TableRow>
            {showVatSubtotals &&
              vatSubtotals.map((subtotal) => (
                <TableRow
                  key={subtotal.rate}
                  className="border-t border-dashed border-border/30 bg-secondary/10 hover:bg-secondary/10"
                >
                  <TableCell
                    colSpan={5}
                    className="font-mono text-[10px] text-muted-foreground/60 py-2"
                  >
                    {t("expenses.vatSubtotal")} {subtotal.rate}% (
                    {subtotal.count} {t("expenses.items")})
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-right py-2">
                    {formatCurrency(subtotal.subtotal)}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-right py-2">
                    {formatCurrency(subtotal.vat)}
                  </TableCell>
                  <TableCell className="py-2" />
                  <TableCell className="font-mono text-[10px] text-right py-2">
                    {formatCurrency(subtotal.total)}
                  </TableCell>
                  <TableCell className="py-2" />
                  <TableCell className="py-2" />
                </TableRow>
              ))}
          </TableFooter>
        </Table>
      </div>

      <DeleteExpenseAlert
        expenseId={deleteAlert}
        onClose={() => setDeleteAlert(null)}
        onConfirm={handleDeleteExpense}
      />

      <DuplicateExpenseDialog
        quarterId={quarterId}
        expenses={expenses}
        expense={duplicateExpense}
        onClose={() => setDuplicateExpense(null)}
      />
    </div>
  )
}
