"use client"

import { MoreVertical, Copy, Trash2 } from "lucide-react"
import { Expense } from "@/lib/types"
import { useLanguage } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ExpenseRowActionsProps {
  expense: Expense
  onDuplicate: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseRowActions({
  expense,
  onDuplicate,
  onDelete,
}: ExpenseRowActionsProps) {
  const { t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onDuplicate(expense)}>
          <Copy className="mr-2 h-4 w-4" />
          {t("expenses.duplicate")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(expense.id)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("expenses.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
