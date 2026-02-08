"use client"

import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useStorageData } from "@/lib/use-storage-data"
import { useStorage } from "@/lib/storage-context"
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
import { useLanguage } from "@/lib/i18n-context"

interface InvoicesViewProps {
  quarterId: string
}

export function InvoicesView({ quarterId }: InvoicesViewProps) {
  const { t } = useLanguage()
  const { activeStorage } = useStorage()
  const { content, isPending, error } = useStorageData(quarterId, "invoices")

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

  if (!content || content.length === 0) {
    return (
      <Alert>
        <AlertDescription>No invoices found</AlertDescription>
      </Alert>
    )
  }

  const totalSubtotal = content.reduce((s, i) => s + i.subtotal, 0)
  const totalVat = content.reduce((s, i) => s + i.vat, 0)
  const totalAmount = content.reduce((s, i) => s + i.total, 0)

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          {t("invoices.sentInvoices")}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {quarterId} &middot; {activeStorage.name} &middot; {content.length}{" "}
          {t("invoices.sentInvoices").toLowerCase()}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t("invoices.totalInvoiced"), value: totalAmount },
          {
            label: t("invoices.collected"),
            value: content
              .filter((i) => i.paymentDate != null)
              .reduce((s, i) => s + i.total, 0),
          },
          {
            label: t("invoices.outstanding"),
            value: content
              .filter((i) => i.paymentDate == null)
              .reduce((s, i) => s + i.total, 0),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-sm border border-border bg-card px-4 py-3"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
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
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-center">
                {t("invoices.paymentDate")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.map((inv) => (
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
                <TableCell className="font-mono text-sm font-semibold text-right">
                  {formatCurrency(inv.total)}
                </TableCell>
                <TableCell className="text-center">
                  <PaymentDateCell paymentDate={inv.paymentDate} />
                </TableCell>
              </TableRow>
            ))}
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
              <TableCell className="font-mono text-sm font-bold text-right">
                {formatCurrency(totalAmount)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
