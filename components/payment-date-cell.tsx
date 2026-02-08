"use client"

import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/ledger-utils"
import { useLanguage } from "@/lib/i18n-context"

interface PaymentDateCellProps {
  paymentDate: string | null | undefined
}

export function PaymentDateCell({ paymentDate }: PaymentDateCellProps) {
  const { t } = useLanguage()

  if (paymentDate) {
    return (
      <Badge className="rounded-sm font-mono text-[10px] uppercase tracking-wider bg-[hsl(var(--ledger-green))] text-[hsl(var(--card))]">
        {formatDate(paymentDate)}
      </Badge>
    )
  }

  return (
    <Badge className="rounded-sm font-mono text-[10px] uppercase tracking-wider bg-muted text-muted-foreground">
      {t("invoices.pending")}
    </Badge>
  )
}
