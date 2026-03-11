"use client"

import { Trash2, Link2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { CashflowEntry } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"

interface CashflowLinkingCellProps {
  entry: CashflowEntry
  onRemoveLink?: () => void
  onLink?: () => void
}

export function CashflowLinkingCell({
  entry,
  onRemoveLink,
  onLink,
}: CashflowLinkingCellProps) {
  const isIncome = entry.income != null
  const { t } = useLanguage()
  return (
    <div className="py-2 min-w-0 flex items-start gap-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground shrink-0">
            {formatDate(entry.date)}
          </span>
          <span
            className={cn(
              "font-mono text-xs font-semibold shrink-0",
              isIncome
                ? "text-[hsl(var(--ledger-green))]"
                : "text-[hsl(var(--ledger-red))]"
            )}
          >
            {isIncome
              ? formatCurrency(entry.income!)
              : formatCurrency(entry.expense ?? entry.balance)}
          </span>
        </div>
        <div className="text-sm truncate text-muted-foreground">
          {entry.concept}
        </div>
      </div>
      {onLink && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          title={t("linking.linkCashflow")}
          onClick={onLink}
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
      )}
      {onRemoveLink && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          title={t("linking.removeLink")}
          onClick={onRemoveLink}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
