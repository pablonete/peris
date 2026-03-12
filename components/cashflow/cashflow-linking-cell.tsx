"use client"

import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { CashflowEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CashflowLinkingCellProps {
  entry: CashflowEntry
}

export function CashflowLinkingCell({ entry }: CashflowLinkingCellProps) {
  const isIncome = entry.income != null
  return (
    <div className="py-2 min-w-0">
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
  )
}
