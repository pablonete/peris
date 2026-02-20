"use client"

import { MoreVertical, Tag } from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CashflowRowActionsProps {
  onAssignCategory: () => void
}

export function CashflowRowActions({
  onAssignCategory,
}: CashflowRowActionsProps) {
  const { t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onAssignCategory}>
          <Tag className="mr-2 h-4 w-4" />
          {t("cashflow.assignCategory")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
