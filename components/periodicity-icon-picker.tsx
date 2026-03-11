"use client"

import { Plus } from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Periodicity, PERIODICITY_OPTIONS } from "@/model/cashflow/periodicity"

interface PeriodicityIconPickerProps {
  periodicity?: Periodicity
  onChangePeriodicity: (periodicity: Periodicity) => void
}

export function PeriodicityIconPicker({
  periodicity,
  onChangePeriodicity,
}: PeriodicityIconPickerProps) {
  const { t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {periodicity ? (
          <button
            type="button"
            className="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center border border-current text-[12px] leading-none hover:opacity-70"
            title={t(`cashflow.periodicityLabel.${periodicity}`)}
            aria-label={t(`cashflow.periodicityLabel.${periodicity}`)}
          >
            {t(`cashflow.periodicity.${periodicity}`)}
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center text-muted-foreground/40 hover:text-muted-foreground"
            title={t("cashflow.setPeriodicity")}
            aria-label={t("cashflow.setPeriodicity")}
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onChangePeriodicity(undefined)}>
          {t("cashflow.periodicityNone")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {PERIODICITY_OPTIONS.map((value) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onChangePeriodicity(value)}
            className={periodicity === value ? "font-medium" : ""}
          >
            {t(`cashflow.periodicityLabel.${value}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
