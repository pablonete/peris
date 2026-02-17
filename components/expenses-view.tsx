"use client"

import { useState } from "react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useStorageData } from "@/lib/use-storage-data"
import { useStorage } from "@/lib/storage-context"
import { useEditingState } from "@/lib/editing-state-context"
import { Expense } from "@/lib/types"
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
                className="h-2 w-2 rounded-full bg-green-600"
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
                          <div key={idx}>{formatCurrency(vat.subtotal)}</div>
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
                            key={idx}
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
                    <PaymentDateCell paymentDate={exp.paymentDate} />
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
              <TableCell />
            </TableRow>
            {vatSubtotals.map((subtotal) => (
              <TableRow
                key={subtotal.rate}
                className="border-t border-dashed border-border/30 bg-secondary/10 hover:bg-secondary/10"
              >
                <TableCell
                  colSpan={5}
                  className="font-mono text-[10px] text-muted-foreground/60"
                >
                  {t("expenses.vatSubtotal")} {subtotal.rate}% ({subtotal.count}{" "}
                  {t("expenses.items")})
                </TableCell>
                <TableCell className="font-mono text-[10px] text-right text-muted-foreground/60">
                  {formatCurrency(subtotal.subtotal)}
                </TableCell>
                <TableCell className="font-mono text-[10px] text-right text-muted-foreground/60">
                  {formatCurrency(subtotal.vat)}
                </TableCell>
                <TableCell className="font-mono text-[10px] text-right text-muted-foreground/60">
                  {formatCurrency(subtotal.taxRetention)}
                </TableCell>
                <TableCell className="font-mono text-[10px] text-right text-muted-foreground/60">
                  {formatCurrency(subtotal.total)}
                </TableCell>
                <TableCell />
                <TableCell />
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

function getVatSubtotals(expenses: Expense[]) {
  const subtotalsMap = new Map<
    number,
    {
      expenseIds: Set<string>
      subtotal: number
      vat: number
      taxRetention: number
      total: number
    }
  >()

  expenses.forEach((expense) => {
    const expenseSubtotalSum = expense.vat.reduce(
      (sum, v) => sum + v.subtotal,
      0
    )
    const expenseTaxRetention = expense.taxRetention || 0

    expense.vat.forEach((vatItem) => {
      const existing = subtotalsMap.get(vatItem.rate) || {
        expenseIds: new Set<string>(),
        subtotal: 0,
        vat: 0,
        taxRetention: 0,
        total: 0,
      }

      const vatItemProportion =
        expenseSubtotalSum > 0 ? vatItem.subtotal / expenseSubtotalSum : 0
      const proportionalTaxRetention = expenseTaxRetention * vatItemProportion
      const proportionalTotal =
        vatItem.subtotal + vatItem.amount - proportionalTaxRetention

      existing.expenseIds.add(expense.id)
      subtotalsMap.set(vatItem.rate, {
        expenseIds: existing.expenseIds,
        subtotal: existing.subtotal + vatItem.subtotal,
        vat: existing.vat + vatItem.amount,
        taxRetention: existing.taxRetention + proportionalTaxRetention,
        total: existing.total + proportionalTotal,
      })
    })
  })

  return Array.from(subtotalsMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([rate, data]) => ({
      rate,
      count: data.expenseIds.size,
      subtotal: data.subtotal,
      vat: data.vat,
      taxRetention: data.taxRetention,
      total: data.total,
    }))
}
