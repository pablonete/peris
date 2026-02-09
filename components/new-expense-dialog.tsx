"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { formatCurrency } from "@/lib/ledger-utils"
import { useEditingState } from "@/lib/editing-state-context"
import { useFileSha } from "@/lib/use-storage-data"
import { Expense } from "@/lib/types"
import { useLanguage } from "@/lib/i18n-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface NewExpenseDialogProps {
  quarterId: string
  expenses: Expense[]
}

interface DuplicateExpenseDialogProps {
  quarterId: string
  expenses: Expense[]
  expense: Expense | null
  onClose: () => void
}

const IRPF_RATE = 15

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10)

const roundCurrency = (value: number) => Math.round(value * 100) / 100

interface VatLineItem {
  id: string
  rate: string
  subtotal: string
}

function getNumeric(vatLines: VatLineItem[], applyIrpf: boolean) {
  const vatItems = vatLines.map((line) => {
    const parsedSubtotal = Number.parseFloat(line.subtotal)
    const subtotal = Number.isNaN(parsedSubtotal)
      ? 0
      : roundCurrency(parsedSubtotal)
    const parsedRate = Number.parseFloat(line.rate)
    const rate = Number.isNaN(parsedRate) ? 0 : parsedRate
    return {
      subtotal,
      rate,
      amount: roundCurrency((subtotal * rate) / 100),
    }
  })

  const baseAmount = vatItems.reduce((sum, item) => sum + item.subtotal, 0)
  const vatAmount = vatItems.reduce((sum, item) => sum + item.amount, 0)
  const irpfAmount = applyIrpf
    ? roundCurrency((baseAmount * IRPF_RATE) / 100)
    : 0

  return {
    baseAmount,
    vatItems,
    vatAmount,
    irpfAmount,
    get total() {
      return roundCurrency(this.baseAmount + this.vatAmount - this.irpfAmount)
    },
  }
}

interface ExpenseDialogContentProps {
  quarterId: string
  expenses: Expense[]
  initialExpense?: Expense | null
  onSuccess: () => void
  onCancel: () => void
}

function ExpenseDialogContent({
  quarterId,
  expenses,
  initialExpense,
  onSuccess,
  onCancel,
}: ExpenseDialogContentProps) {
  const { t } = useLanguage()
  const { getEditingFile, setEditingFile } = useEditingState()
  const editingFile = getEditingFile(quarterId, "expenses")
  const fileSha = useFileSha(quarterId, "expenses")

  const [expenseDate, setExpenseDate] = useState(
    initialExpense?.date || getTodayIsoDate()
  )
  const [paymentDate, setPaymentDate] = useState(
    initialExpense?.paymentDate || ""
  )
  const [vendor, setVendor] = useState(initialExpense?.vendor || "")
  const [number, setNumber] = useState(initialExpense?.number || "")
  const [concept, setConcept] = useState(initialExpense?.concept || "")
  const [vatLines, setVatLines] = useState<VatLineItem[]>(
    initialExpense
      ? initialExpense.vat.map((item, idx) => ({
          id: idx === 0 ? "initial" : `vat-${idx}`,
          rate: String(item.rate),
          subtotal: String(item.subtotal),
        }))
      : [{ id: "initial", rate: "", subtotal: "" }]
  )
  const [applyIrpf, setApplyIrpf] = useState(!!initialExpense?.taxRetention)
  const [isPaid, setIsPaid] = useState(!!initialExpense?.paymentDate)

  const addVatLine = () => {
    setVatLines((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        rate: "",
        subtotal: "",
      },
    ])
  }

  const removeVatLine = (id: string) => {
    setVatLines((prev) => prev.filter((line) => line.id !== id))
  }

  const updateVatLine = (
    id: string,
    field: "rate" | "subtotal",
    value: string
  ) => {
    setVatLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    )
  }

  const numeric = getNumeric(vatLines, applyIrpf)

  const isValid =
    expenseDate && vendor.trim() && concept.trim() && numeric.baseAmount > 0

  const handleSubmit = () => {
    if (!isValid) return

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `exp-${Date.now()}`

    const newExpense: Expense = {
      id,
      date: expenseDate,
      number: number || undefined,
      vendor: vendor.trim(),
      concept: concept.trim(),
      vat: numeric.vatItems,
      taxRetention: applyIrpf ? numeric.irpfAmount : undefined,
      total: numeric.total,
      paymentDate: isPaid ? paymentDate : undefined,
    }

    const nextExpenses = [...expenses, newExpense]
    const nextSha = editingFile?.sha ?? fileSha
    setEditingFile(quarterId, "expenses", nextExpenses, nextSha)
    onSuccess()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("expenses.newExpense")}</DialogTitle>
        <DialogDescription>{t("expenses.newExpenseDesc")}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="expense-date">{t("expenses.expenseDate")}</Label>
            <Input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>
          <div className="grid">
            <div className="flex items-start gap-2">
              <Checkbox
                id="is-paid"
                checked={isPaid}
                onCheckedChange={(checked) => {
                  setIsPaid(checked === true)
                  if (checked === true) {
                    setPaymentDate(getTodayIsoDate())
                  } else {
                    setPaymentDate("")
                  }
                }}
              />
              <Label htmlFor="is-paid" className="text-sm">
                {t("expenses.paid")}
              </Label>
            </div>
            {isPaid && (
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="vendor">{t("expenses.vendor")}</Label>
            <Input
              id="vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="number">Nº Factura</Label>
            <Input
              id="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="concept">{t("expenses.concept")}</Label>
          <Input
            id="concept"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>{t("expenses.vatRate")}</Label>
          <div className="space-y-2">
            {vatLines.map((line, index) => {
              const vatItem = numeric.vatItems[index]
              return (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-4">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={line.subtotal}
                      onChange={(e) =>
                        updateVatLine(line.id, "subtotal", e.target.value)
                      }
                      placeholder={t("expenses.subtotal")}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="0.01"
                      value={line.rate}
                      onChange={(e) =>
                        updateVatLine(line.id, "rate", e.target.value)
                      }
                      placeholder="IVA %"
                    />
                  </div>
                  <div className="col-span-3 text-right font-mono text-sm">
                    {formatCurrency(vatItem?.amount || 0)}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {index === 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={addVatLine}
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVatLine(line.id)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="irpf"
            checked={applyIrpf}
            onCheckedChange={(checked) => setApplyIrpf(checked === true)}
          />
          <Label htmlFor="irpf" className="text-sm">
            {t("expenses.irpfApply")}
          </Label>
        </div>

        <div className="rounded-sm border border-border bg-secondary/20 px-4 py-3">
          {numeric.baseAmount !== numeric.total && (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("expenses.subtotal")}
                </span>
                <span className="font-mono">
                  {formatCurrency(numeric.baseAmount)}
                </span>
              </div>
              {numeric.vatItems.map((item, idx) => (
                <div
                  key={idx}
                  className="mb-2 flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    IVA {item.rate}% de {formatCurrency(item.subtotal)}
                  </span>
                  <span className="font-mono">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </>
          )}
          {numeric.irpfAmount > 0 && (
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("expenses.irpfAmount")}
              </span>
              <span className="font-mono">
                {formatCurrency(-numeric.irpfAmount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{t("expenses.total")}</span>
            <span className="font-mono text-[hsl(var(--ledger-red))]">
              {formatCurrency(numeric.total)}
            </span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {t("expenses.cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid}>
          {t("expenses.createExpense")}
        </Button>
      </DialogFooter>
    </>
  )
}

export function NewExpenseDialog({
  quarterId,
  expenses,
}: NewExpenseDialogProps) {
  const { t } = useLanguage()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          {t("expenses.newExpense")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <ExpenseDialogContent
          quarterId={quarterId}
          expenses={expenses}
          onSuccess={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function DuplicateExpenseDialog({
  quarterId,
  expenses,
  expense,
  onClose,
}: DuplicateExpenseDialogProps) {
  return (
    <Dialog open={!!expense} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px]">
        <ExpenseDialogContent
          quarterId={quarterId}
          expenses={expenses}
          initialExpense={expense}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
