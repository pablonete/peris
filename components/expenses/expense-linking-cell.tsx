"use client"

import { Receipt, Plus, X } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useData } from "@/lib/use-data"
import { AttachmentCell } from "@/components/attachment-cell"
import { Expense } from "@/lib/types"
import { useLanguage } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"

interface ExpenseLinkingCellProps {
  expense: Expense
  quarterId: string
  onStartLinking?: () => void
  onCancelLinking?: () => void
}

export function ExpenseLinkingCell({
  expense,
  quarterId,
  onStartLinking,
  onCancelLinking,
}: ExpenseLinkingCellProps) {
  const { activeStorage } = useData()
  const { t } = useLanguage()

  return (
    <div className="py-2 min-w-0 flex items-start gap-1">
      <div className="flex-1 min-w-0">
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
      {onCancelLinking && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          title={t("linking.cancelLinking")}
          onClick={onCancelLinking}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      {onStartLinking && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          title={t("linking.startLinking")}
          onClick={onStartLinking}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
