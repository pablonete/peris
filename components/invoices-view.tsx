"use client"

import { useState } from "react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useStorageData } from "@/lib/use-storage-data"
import { useStorage } from "@/lib/storage-context"
import { useEditingState } from "@/lib/editing-state-context"
import { Invoice } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ErrorBanner } from "@/components/error-banner"
import { PaymentDateCell } from "@/components/payment-date-cell"
import { AttachmentCell } from "@/components/attachment-cell"
import { SummaryCard } from "@/components/summary-card"
import { EditingIndicator } from "@/components/editing-indicator"
import {
  NewInvoiceDialog,
  DuplicateInvoiceDialog,
} from "@/components/new-invoice-dialog"
import { InvoiceRowActions } from "@/components/invoice-row-actions"
import { DeleteInvoiceAlert } from "@/components/delete-invoice-alert"
import { LinkOrphanFileDialog } from "@/components/link-orphan-file-dialog"
import { useLanguage } from "@/lib/i18n-context"

interface InvoicesViewProps {
  quarterId: string
}

export function InvoicesView({ quarterId }: InvoicesViewProps) {
  const { t } = useLanguage()
  const { activeStorage } = useStorage()
  const { getEditingFile, setEditingFile } = useEditingState()
  const { content, isPending, error } = useStorageData(quarterId, "invoices")
  const isEditing = !!getEditingFile(quarterId, "invoices")
  const [deleteAlert, setDeleteAlert] = useState<string | null>(null)
  const [duplicateInvoice, setDuplicateInvoice] = useState<Invoice | null>(null)
  const [linkOrphanInvoice, setLinkOrphanInvoice] = useState<Invoice | null>(
    null
  )

  if (isPending) {
    return (
      <div className="text-center text-muted-foreground">
        {t("invoices.sentInvoices")}...
      </div>
    )
  }

  if (error) {
    return <ErrorBanner title={t("sidebar.invoices")} message={error.message} />
  }

  if (!content) {
    return null
  }

  const totalSubtotal = content.reduce((s, i) => s + i.subtotal, 0)
  const totalVat = content.reduce((s, i) => s + i.vat, 0)
  const totalAmount = content.reduce((s, i) => s + i.total, 0)
  const hasCurrency = content.some((i) => i.currency)

  const handleDeleteInvoice = (id: string) => {
    const nextInvoices = content.filter((i) => i.id !== id)
    const editingFile = getEditingFile(quarterId, "invoices")
    setEditingFile(quarterId, "invoices", nextInvoices, editingFile?.sha)
    setDeleteAlert(null)
  }

  const handleLinkOrphan = (filename: string) => {
    if (!linkOrphanInvoice) return

    const nextInvoices = content.map((i) =>
      i.id === linkOrphanInvoice.id ? { ...i, filename } : i
    )
    const editingFile = getEditingFile(quarterId, "invoices")
    setEditingFile(quarterId, "invoices", nextInvoices, editingFile?.sha)
    setLinkOrphanInvoice(null)
  }

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-foreground">
              {t("invoices.sentInvoices")}
              <EditingIndicator isEditing={isEditing} />
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {quarterId} &middot; {activeStorage.name} &middot;{" "}
              {content.length} {t("invoices.sentInvoices").toLowerCase()}
            </p>
          </div>
          <NewInvoiceDialog quarterId={quarterId} invoices={content} />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label={t("invoices.totalInvoiced")} value={totalAmount} />
        <SummaryCard
          label={t("invoices.collected")}
          value={content
            .filter((i) => i.paymentDate != null)
            .reduce((s, i) => s + i.total, 0)}
        />
        <SummaryCard
          label={t("invoices.outstanding")}
          value={content
            .filter((i) => i.paymentDate == null)
            .reduce((s, i) => s + i.total, 0)}
        />
      </div>

      <div className="rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-foreground/15 hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                {t("invoices.date")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                No.
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                {t("invoices.client")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Concept
              </TableHead>
              <TableHead className="w-[40px]" />
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Subtotal
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                VAT
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                {t("invoices.total")}
              </TableHead>
              {hasCurrency && (
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-center">
                  {t("invoices.currency")}
                </TableHead>
              )}
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-center">
                {t("invoices.paymentDate")}
              </TableHead>
              <TableHead className="w-[40px] text-center" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-6 text-center">
                  {t("invoices.emptyState")}
                </TableCell>
              </TableRow>
            ) : (
              content.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="border-b border-dashed border-[hsl(var(--ledger-line))] hover:bg-secondary/50"
                >
                  <TableCell className="font-mono text-xs">
                    {formatDate(inv.date)}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">
                    {inv.number}
                  </TableCell>
                  <TableCell className="text-sm">{inv.client}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {inv.concept}
                  </TableCell>
                  <TableCell className="text-center">
                    <AttachmentCell
                      storage={activeStorage}
                      quarterId={quarterId}
                      type="invoices"
                      filename={inv.filename}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    {formatCurrency(inv.subtotal)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right text-muted-foreground">
                    {inv.vat > 0 ? formatCurrency(inv.vat) : "\u2014"}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold text-right text-[hsl(var(--ledger-green))]">
                    {formatCurrency(inv.total)}
                  </TableCell>
                  {hasCurrency && (
                    <TableCell className="text-center">
                      {inv.currency ? (
                        <div className="font-mono text-xs text-muted-foreground">
                          {inv.currency.symbol}{" "}
                          {inv.currency.total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <PaymentDateCell
                      paymentDate={inv.paymentDate}
                      variant="invoice"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <InvoiceRowActions
                      invoice={inv}
                      onDuplicate={setDuplicateInvoice}
                      onDelete={setDeleteAlert}
                      onLinkOrphan={setLinkOrphanInvoice}
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
              <TableCell className="font-mono text-sm font-bold text-right text-[hsl(var(--ledger-green))]">
                {formatCurrency(totalAmount)}
              </TableCell>
              {hasCurrency && <TableCell />}
              <TableCell />
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <DeleteInvoiceAlert
        invoiceId={deleteAlert}
        onClose={() => setDeleteAlert(null)}
        onConfirm={handleDeleteInvoice}
      />

      <DuplicateInvoiceDialog
        quarterId={quarterId}
        invoices={content}
        invoice={duplicateInvoice}
        onClose={() => setDuplicateInvoice(null)}
      />

      <LinkOrphanFileDialog
        open={!!linkOrphanInvoice}
        onClose={() => setLinkOrphanInvoice(null)}
        onLink={handleLinkOrphan}
        quarterId={quarterId}
        type="invoices"
        linkedItems={content}
      />
    </div>
  )
}
