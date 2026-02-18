"use client"

import { MoreVertical, Copy, Trash2, Link2 } from "lucide-react"
import { Invoice } from "@/lib/types"
import { useLanguage } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface InvoiceRowActionsProps {
  invoice: Invoice
  onDuplicate: (invoice: Invoice) => void
  onDelete: (id: string) => void
  onLinkOrphan: (invoice: Invoice) => void
}

export function InvoiceRowActions({
  invoice,
  onDuplicate,
  onDelete,
  onLinkOrphan,
}: InvoiceRowActionsProps) {
  const { t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onDuplicate(invoice)}>
          <Copy className="mr-2 h-4 w-4" />
          {t("invoices.duplicate")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLinkOrphan(invoice)}>
          <Link2 className="mr-2 h-4 w-4" />
          {t("invoices.linkOrphan")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(invoice.id)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("invoices.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
