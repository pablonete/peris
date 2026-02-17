"use client"

import { useRef, useState, useMemo } from "react"
import { Plus, X, File, AlertCircle } from "lucide-react"
import { formatCurrency, getQuarterFromDate } from "@/lib/ledger-utils"
import { generateNextId } from "@/lib/id-utils"
import { readFileAsArrayBuffer } from "@/lib/file-utils"
import { useEditingState } from "@/lib/editing-state-context"
import { useFileSha } from "@/lib/use-storage-data"
import { Expense } from "@/lib/types"
import { useLanguage } from "@/lib/i18n-context"
import { useStorageQuarters } from "@/lib/use-storage-quarters"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  targetQuarterId?: string
}

function ExpenseDialogContent({
  quarterId,
  expenses,
  initialExpense,
  onSuccess,
  onCancel,
  targetQuarterId,
}: ExpenseDialogContentProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { quarters } = useStorageQuarters()
  const { getEditingFile, setEditingFile } = useEditingState()
  const editingFile = getEditingFile(quarterId, "expenses")
  const fileSha = useFileSha(quarterId, "expenses")
  const targetSha = useFileSha(targetQuarterId || quarterId, "expenses")

  const isDuplicate = !!initialExpense

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
  const [filename, setFilename] = useState(initialExpense?.filename || "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { addAttachment } = useEditingState()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFilename(file.name)
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setFilename("")
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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

  const calculatedTargetQuarter = useMemo(() => {
    if (!expenseDate) return quarterId
    return getQuarterFromDate(expenseDate)
  }, [expenseDate, quarterId])

  const targetQuarterSha = useFileSha(calculatedTargetQuarter, "expenses")

  const isDifferentQuarter = calculatedTargetQuarter !== quarterId
  const quarterExists = quarters.includes(calculatedTargetQuarter)

  const isValid =
    expenseDate &&
    vendor.trim() &&
    concept.trim() &&
    numeric.baseAmount > 0 &&
    quarterExists

  const handleSubmit = async () => {
    if (!isValid) return

    const effectiveQuarterId = calculatedTargetQuarter
    const targetData =
      calculatedTargetQuarter !== quarterId
        ? getEditingFile(calculatedTargetQuarter, "expenses")?.data
        : undefined
    const effectiveExpenses: Expense[] =
      calculatedTargetQuarter !== quarterId
        ? ((Array.isArray(targetData) ? targetData : []) as Expense[])
        : expenses
    const effectiveSha =
      calculatedTargetQuarter !== quarterId
        ? (getEditingFile(calculatedTargetQuarter, "expenses")?.sha ??
          targetQuarterSha)
        : (editingFile?.sha ?? fileSha)

    const id = generateNextId(effectiveExpenses, "exp")

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
      filename: filename || undefined,
    }

    // Handle file attachment
    if (selectedFile && filename) {
      try {
        const fileContent = await readFileAsArrayBuffer(selectedFile)
        addAttachment(effectiveQuarterId, filename, fileContent)
      } catch (error) {
        console.error("Failed to upload file:", error)
        // Continue even if file upload fails
      }
    }

    const nextExpenses = [...effectiveExpenses, newExpense].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    setEditingFile(effectiveQuarterId, "expenses", nextExpenses, effectiveSha)

    onSuccess()

    if (isDifferentQuarter) {
      router.push(`/expenses?q=${effectiveQuarterId}`)
    }
  }

  const dialogTitle = isDuplicate
    ? t("expenses.duplicateExpense")
    : t("expenses.newExpense")

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="expense-date">{t("expenses.expenseDate")}</Label>
              {(isDifferentQuarter || !quarterExists) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle
                        className={`h-4 w-4 ${
                          !quarterExists ? "text-red-600" : "text-orange-600"
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {!quarterExists
                          ? t("expenses.quarterNotFound")
                          : t("expenses.differentQuarterWarning")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
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
                  key={`${item.rate}-${item.subtotal}`}
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
      <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            ref={fileInputRef}
            id="attachment"
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          {!filename && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <File className="h-4 w-4" />
              {t("expenses.attachFile")}
            </Button>
          )}
          {filename && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <File className="h-3.5 w-3.5" />
              <span className="max-w-[180px] truncate">{filename}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("expenses.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {isDifferentQuarter
              ? `${t("expenses.createExpenseTo")} ${calculatedTargetQuarter}`
              : t("expenses.createExpense")}
          </Button>
        </div>
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
