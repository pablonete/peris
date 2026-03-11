"use client"

import { FileText } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useData } from "@/lib/use-data"
import { AttachmentCell } from "@/components/attachment-cell"
import { Invoice } from "@/lib/types"

interface InvoiceLinkingCellProps {
  invoice: Invoice
  quarterId: string
}

export function InvoiceLinkingCell({
  invoice,
  quarterId,
}: InvoiceLinkingCellProps) {
  const { activeStorage } = useData()

  return (
    <div className="py-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          {formatDate(invoice.date)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {invoice.filename && activeStorage && (
            <AttachmentCell
              storage={activeStorage}
              quarterId={quarterId}
              type="invoices"
              filename={invoice.filename}
            />
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
