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

interface InvoiceFormData {
  date: string
  client: string
  number: string
  concept: string
  subtotal: string
  vat: string
  collected: boolean
  paymentDate: string
  filename: string
  currencyEnabled: boolean
  currency: {
    symbol: string
    rate: string
    total: string
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

  const today = new Date().toISOString().slice(0, 10)
  const [invoice, setInvoice] = useState<InvoiceFormData>({
    date: today,
    client: "",
    number: "",
    concept: "",
    subtotal: "",
    vat: "",
    collected: false,
    paymentDate: "",
    filename: "",
    currencyEnabled: false,
    currency: {
      symbol: "",
      rate: "",
      total: "",
    },
  })
  const [file, setFile] = useState<File | null>(null)

  const roundTwo = (n: number) => Math.round(n * 100) / 100

  const subtotalNum = roundTwo(Number.parseFloat(invoice.subtotal) || 0)
  const vatNum = roundTwo(Number.parseFloat(invoice.vat) || 0)
  const totalNum = roundTwo(subtotalNum + vatNum)

  const isValid =
    invoice.date &&
    invoice.client.trim() &&
    invoice.number.trim() &&
    invoice.concept.trim() &&
    subtotalNum > 0

  const setCurrencyField = (
    field: keyof InvoiceFormData["currency"],
    value: string
  ) => {
    setInvoice({
      ...invoice,
      currency: { ...invoice.currency, [field]: value },
    })
  }

  const selectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    if (chosen) {
      setInvoice({ ...invoice, filename: chosen.name })
      setFile(chosen)
    }
  }

  const clearFile = () => {
    setInvoice({ ...invoice, filename: "" })
    setFile(null)
    if (uploadRef.current) uploadRef.current.value = ""
  }

  const submit = async () => {
    if (!isValid) return

    const id = generateNextId(invoices, "inv")

    const record: Invoice = {
      id,
      date: invoice.date,
      number: invoice.number.trim(),
      client: invoice.client.trim(),
      concept: invoice.concept.trim(),
      subtotal: subtotalNum,
      vat: vatNum,
      total: totalNum,
      paymentDate: invoice.collected ? invoice.paymentDate : undefined,
      filename: invoice.filename || undefined,
    }

    if (
      invoice.currencyEnabled &&
      invoice.currency.symbol.trim() &&
      invoice.currency.rate &&
      invoice.currency.total
    ) {
      const rate = Number.parseFloat(invoice.currency.rate)
      const total = Number.parseFloat(invoice.currency.total)
      if (!Number.isNaN(rate) && !Number.isNaN(total)) {
        record.currency = {
          symbol: invoice.currency.symbol.trim(),
          rate: roundTwo(rate),
          total: roundTwo(total),
        }
      }
    }

    if (file && invoice.filename) {
      try {
        const buffer = await readFileAsArrayBuffer(file)
        addAttachment(quarterId, invoice.filename, buffer)
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
              value={invoice.date}
              onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
            />
          </div>
          <div className="grid">
            <div className="flex items-start gap-2">
              <Checkbox
                id="inv-collected"
                checked={invoice.collected}
                onCheckedChange={(c) =>
                  setInvoice({
                    ...invoice,
                    collected: c === true,
                    paymentDate: c === true ? today : "",
                  })
                }
              />
              <Label htmlFor="inv-collected" className="text-sm">
                {t("invoices.collected")}
              </Label>
            </div>
            {invoice.collected && (
              <Input
                id="inv-payment-date"
                type="date"
                value={invoice.paymentDate}
                onChange={(e) =>
                  setInvoice({ ...invoice, paymentDate: e.target.value })
                }
              />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="inv-client">{t("invoices.client")}</Label>
            <Input
              id="inv-client"
              value={invoice.client}
              onChange={(e) =>
                setInvoice({ ...invoice, client: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inv-number">{t("invoices.invoiceNumber")}</Label>
            <Input
              id="inv-number"
              value={invoice.number}
              onChange={(e) =>
                setInvoice({ ...invoice, number: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="inv-concept">{t("invoices.concept")}</Label>
          <Input
            id="inv-concept"
            value={invoice.concept}
            onChange={(e) =>
              setInvoice({ ...invoice, concept: e.target.value })
            }
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
              value={invoice.subtotal}
              onChange={(e) =>
                setInvoice({ ...invoice, subtotal: e.target.value })
              }
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
              value={invoice.vat}
              onChange={(e) => setInvoice({ ...invoice, vat: e.target.value })}
            />
          </div>
        </div>

        <div className="rounded-sm border border-border bg-secondary/20 px-4 py-3">
          {vatNum > 0 && (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("invoices.subtotal")}
                </span>
                <span className="font-mono">{formatCurrency(subtotalNum)}</span>
              </div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("invoices.vat")}
                </span>
                <span className="font-mono">{formatCurrency(vatNum)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{t("invoices.total")}</span>
            <span className="font-mono text-[hsl(var(--ledger-green))]">
              {formatCurrency(totalNum)}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="mb-3 flex items-center gap-2">
            <Checkbox
              id="inv-currency"
              checked={invoice.currencyEnabled}
              onCheckedChange={(c) =>
                setInvoice({ ...invoice, currencyEnabled: c === true })
              }
            />
            <Label htmlFor="inv-currency" className="text-sm">
              {t("invoices.currencyCheckbox")}
            </Label>
          </div>

          {invoice.currencyEnabled && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="inv-currency-symbol">
                  {t("invoices.currencySymbol")}
                </Label>
                <Input
                  id="inv-currency-symbol"
                  value={invoice.currency.symbol}
                  onChange={(e) => setCurrencyField("symbol", e.target.value)}
                  placeholder="USD"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inv-currency-rate">
                  {t("invoices.currencyRate")}
                </Label>
                <Input
                  id="inv-currency-rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={invoice.currency.rate}
                  onChange={(e) => setCurrencyField("rate", e.target.value)}
                  placeholder="0.74"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inv-currency-total">
                  {t("invoices.currencyTotal")}
                </Label>
                <Input
                  id="inv-currency-total"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={invoice.currency.total}
                  onChange={(e) => setCurrencyField("total", e.target.value)}
                  placeholder="7051.99"
                />
              </div>
            </div>
          )}
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
          {invoice.filename ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs">
              <File className="h-3.5 w-3.5" />
              <span className="max-w-[180px] truncate">{invoice.filename}</span>
              <button
                type="button"
                onClick={clearFile}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => uploadRef.current?.click()}
            >
              {t("expenses.attachFile")}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("invoices.cancel")}
          </Button>
          <Button onClick={submit} disabled={!isValid}>
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
