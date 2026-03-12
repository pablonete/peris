"use client"

import { Receipt } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useData } from "@/lib/use-data"
import { AttachmentCell } from "@/components/attachment-cell"
import { Expense } from "@/lib/types"

interface ExpenseLinkingCellProps {
  expense: Expense
  quarterId: string
}

export function ExpenseLinkingCell({
  expense,
  quarterId,
}: ExpenseLinkingCellProps) {
  const { activeStorage } = useData()

  return (
    <div className="py-2 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          {formatDate(expense.date)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {expense.filename && activeStorage && (
            <AttachmentCell
              storage={activeStorage}
              quarterId={quarterId}
              type="expenses"
              filename={expense.filename}
            />
          )}
          <Receipt className="h-3 w-3 text-[hsl(var(--ledger-red))] shrink-0" />
          <span className="font-mono text-xs font-semibold text-[hsl(var(--ledger-red))]">
            {formatCurrency(expense.total)}
          </span>
        </div>
      </div>
      <div className="text-sm truncate text-muted-foreground">
        {expense.vendor} — {expense.concept}
      </div>
    </div>
  )
}
