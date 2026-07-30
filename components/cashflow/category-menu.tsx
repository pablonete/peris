"use client"

import { useLanguage } from "@/lib/i18n-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, X } from "lucide-react"

interface CategoryMenuProps {
  category?: string
  categories: string[]
  onAssign: (category: string | undefined) => void
}

export function CategoryMenu({
  category,
  categories,
  onAssign,
}: CategoryMenuProps) {
  const { t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="mt-0.5 block text-left font-mono text-[10px] leading-tight transition-colors hover:text-foreground/70"
        >
          {category ? (
            <span className="text-muted-foreground/70">{category}</span>
          ) : (
            <span className="italic text-muted-foreground/40">
              {t("cashflow.noCategory")}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        {categories.map((cat) => (
          <DropdownMenuItem
            key={cat}
            onClick={() => onAssign(cat)}
            className={`font-mono text-xs ${cat === category ? "font-medium" : "font-normal"}`}
          >
            <Check
              className={`mr-2 h-3 w-3 ${cat === category ? "opacity-100" : "opacity-0"}`}
            />
            {cat}
          </DropdownMenuItem>
        ))}
        {category && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAssign(undefined)}
              className="text-muted-foreground"
            >
              <X className="mr-2 h-3 w-3" />
              {t("cashflow.clearCategory")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
