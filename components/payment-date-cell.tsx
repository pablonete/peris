"use client"

import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/ledger-utils"
import { useLanguage } from "@/lib/i18n-context"

interface PaymentDateCellProps {
  paymentDate: string | null | undefined
  variant?: "invoice" | "expense"
}

export function PaymentDateCell({
  paymentDate,
  variant = "invoice",
}: PaymentDateCellProps) {
  const { t } = useLanguage()

  if (paymentDate) {
    const bgColor =
      variant === "invoice"
        ? "bg-[hsl(var(--ledger-green))]"
        : "bg-[hsl(var(--ledger-red))]"
    return (
      <Badge
        className={`rounded-sm font-mono text-[10px] uppercase tracking-wider ${bgColor} text-[hsl(var(--card))]`}
      >
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
