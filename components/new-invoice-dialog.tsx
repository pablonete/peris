"use client"

import { useRef, useState } from "react"
import { Plus, X, File } from "lucide-react"
import { formatCurrency } from "@/lib/ledger-utils"
import { generateNextId } from "@/lib/id-utils"
import { readFileAsArrayBuffer } from "@/lib/file-utils"
import { useEditingState } from "@/lib/editing-state-context"
import { useFileSha } from "@/lib/use-storage-data"
import { Invoice } from "@/lib/types"
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

interface NewInvoiceDialogProps {
  quarterId: string
  invoices: Invoice[]
}

function useInvoiceForm() {
  const today = new Date().toISOString().slice(0, 10)

  const [issueDate, setIssueDate] = useState(today)
  const [clientName, setClientName] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [serviceDescription, setServiceDescription] = useState("")
  const [baseAmountStr, setBaseAmountStr] = useState("")
  const [vatAmountStr, setVatAmountStr] = useState("")
  const [collected, setCollected] = useState(false)
  const [collectionDate, setCollectionDate] = useState("")
  const [filename, setFilename] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fxEnabled, setFxEnabled] = useState(false)
  const [fxSymbol, setFxSymbol] = useState("")
  const [fxRate, setFxRate] = useState("")
  const [fxTotal, setFxTotal] = useState("")

  const roundTwo = (n: number) => Math.round(n * 100) / 100

  const baseAmount = (() => {
    const val = Number.parseFloat(baseAmountStr)
    return Number.isNaN(val) ? 0 : roundTwo(val)
  })()

  const vatAmount = (() => {
    const val = Number.parseFloat(vatAmountStr)
    return Number.isNaN(val) ? 0 : roundTwo(val)
  })()

  const totalAmount = roundTwo(baseAmount + vatAmount)

  const valid =
    issueDate &&
    clientName.trim() &&
    invoiceNumber.trim() &&
    serviceDescription.trim() &&
    baseAmount > 0

  const toggleCollected = (checked: boolean) => {
    setCollected(checked)
    setCollectionDate(checked ? new Date().toISOString().slice(0, 10) : "")
  }

  return {
    issueDate,
    setIssueDate,
    clientName,
    setClientName,
    invoiceNumber,
    setInvoiceNumber,
    serviceDescription,
    setServiceDescription,
    baseAmountStr,
    setBaseAmountStr,
    vatAmountStr,
    setVatAmountStr,
    collected,
    toggleCollected,
    collectionDate,
    setCollectionDate,
    filename,
    setFilename,
    file,
    setFile,
    fxEnabled,
    setFxEnabled,
    fxSymbol,
    setFxSymbol,
    fxRate,
    setFxRate,
    fxTotal,
    setFxTotal,
    baseAmount,
    vatAmount,
    totalAmount,
    valid,
  }
}

function InvoiceFormContent({
  quarterId,
  invoices,
  onSuccess,
  onCancel,
}: {
  quarterId: string
  invoices: Invoice[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const { getEditingFile, setEditingFile, addAttachment } = useEditingState()
  const editingFile = getEditingFile(quarterId, "invoices")
  const sha = useFileSha(quarterId, "invoices")
  const uploadRef = useRef<HTMLInputElement>(null)

  const form = useInvoiceForm()

  const selectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    if (chosen) {
      form.setFilename(chosen.name)
      form.setFile(chosen)
    }
  }

  const clearFile = () => {
    form.setFilename("")
    form.setFile(null)
    if (uploadRef.current) uploadRef.current.value = ""
  }

  const submit = async () => {
    if (!form.valid) return

    const id = generateNextId(invoices, "inv")
    const roundTwo = (n: number) => Math.round(n * 100) / 100

    const record: Invoice = {
      id,
      date: form.issueDate,
      number: form.invoiceNumber.trim(),
      client: form.clientName.trim(),
      concept: form.serviceDescription.trim(),
      subtotal: form.baseAmount,
      vat: form.vatAmount,
      total: form.totalAmount,
      paymentDate: form.collected ? form.collectionDate : undefined,
      filename: form.filename || undefined,
    }

    if (form.fxEnabled && form.fxSymbol.trim() && form.fxRate && form.fxTotal) {
      const rate = Number.parseFloat(form.fxRate)
      const total = Number.parseFloat(form.fxTotal)
      if (!Number.isNaN(rate) && !Number.isNaN(total)) {
        record.currency = {
          symbol: form.fxSymbol.trim(),
          rate: roundTwo(rate),
          total: roundTwo(total),
        }
      }
    }

    if (form.file && form.filename) {
      try {
        const buffer = await readFileAsArrayBuffer(form.file)
        addAttachment(quarterId, form.filename, buffer)
      } catch (e) {
        console.error("Attachment error:", e)
      }
    }

    const updated = [...invoices, record].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    const currentSha = editingFile?.sha ?? sha
    setEditingFile(quarterId, "invoices", updated, currentSha)
    onSuccess()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("invoices.newInvoice")}</DialogTitle>
        <DialogDescription>{t("invoices.newInvoiceDesc")}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="inv-date">{t("invoices.invoiceDate")}</Label>
            <Input
              id="inv-date"
              type="date"
              value={form.issueDate}
              onChange={(e) => form.setIssueDate(e.target.value)}
            />
          </div>
          <div className="grid">
            <div className="flex items-start gap-2">
              <Checkbox
                id="inv-collected"
                checked={form.collected}
                onCheckedChange={(c) => form.toggleCollected(c === true)}
              />
              <Label htmlFor="inv-collected" className="text-sm">
                {t("invoices.collected")}
              </Label>
            </div>
            {form.collected && (
              <Input
                id="inv-payment-date"
                type="date"
                value={form.collectionDate}
                onChange={(e) => form.setCollectionDate(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="inv-client">{t("invoices.client")}</Label>
            <Input
              id="inv-client"
              value={form.clientName}
              onChange={(e) => form.setClientName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inv-number">{t("invoices.invoiceNumber")}</Label>
            <Input
              id="inv-number"
              value={form.invoiceNumber}
              onChange={(e) => form.setInvoiceNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="inv-concept">{t("invoices.concept")}</Label>
          <Input
            id="inv-concept"
            value={form.serviceDescription}
            onChange={(e) => form.setServiceDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="inv-subtotal">{t("invoices.subtotal")}</Label>
            <Input
              id="inv-subtotal"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.baseAmountStr}
              onChange={(e) => form.setBaseAmountStr(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inv-vat">{t("invoices.vat")}</Label>
            <Input
              id="inv-vat"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.vatAmountStr}
              onChange={(e) => form.setVatAmountStr(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="inv-fx"
            checked={form.fxEnabled}
            onCheckedChange={(c) => form.setFxEnabled(c === true)}
          />
          <Label htmlFor="inv-fx" className="text-sm">
            {t("invoices.currencyCheckbox")}
          </Label>
        </div>

        {form.fxEnabled && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="inv-fx-symbol">
                {t("invoices.currencySymbol")}
              </Label>
              <Input
                id="inv-fx-symbol"
                value={form.fxSymbol}
                onChange={(e) => form.setFxSymbol(e.target.value)}
                placeholder="USD"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inv-fx-rate">{t("invoices.currencyRate")}</Label>
              <Input
                id="inv-fx-rate"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.fxRate}
                onChange={(e) => form.setFxRate(e.target.value)}
                placeholder="0.74"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inv-fx-total">
                {t("invoices.currencyTotal")}
              </Label>
              <Input
                id="inv-fx-total"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.fxTotal}
                onChange={(e) => form.setFxTotal(e.target.value)}
                placeholder="7051.99"
              />
            </div>
          </div>
        )}

        <div className="rounded-sm border border-border bg-secondary/20 px-4 py-3">
          {form.vatAmount > 0 && (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("invoices.subtotal")}
                </span>
                <span className="font-mono">
                  {formatCurrency(form.baseAmount)}
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("invoices.vat")}
                </span>
                <span className="font-mono">
                  {formatCurrency(form.vatAmount)}
                </span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{t("invoices.total")}</span>
            <span className="font-mono text-[hsl(var(--ledger-green))]">
              {formatCurrency(form.totalAmount)}
            </span>
          </div>
        </div>
      </div>
      <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            ref={uploadRef}
            id="inv-attach"
            type="file"
            onChange={selectFile}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          {!form.filename && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => uploadRef.current?.click()}
              className="gap-2"
            >
              <File className="h-4 w-4" />
              {t("expenses.attachFile")}
            </Button>
          )}
          {form.filename && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <File className="h-3.5 w-3.5" />
              <span className="max-w-[180px] truncate">{form.filename}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearFile}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("invoices.cancel")}
          </Button>
          <Button onClick={submit} disabled={!form.valid}>
            {t("invoices.createInvoice")}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

export function NewInvoiceDialog({
  quarterId,
  invoices,
}: NewInvoiceDialogProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          {t("invoices.newInvoice")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <InvoiceFormContent
          quarterId={quarterId}
          invoices={invoices}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
