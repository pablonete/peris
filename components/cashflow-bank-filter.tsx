"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n-context"
import { getBankColorClass } from "@/lib/cashflow-utils"
import { cn } from "@/lib/utils"

interface CashflowBankFilterProps {
  banks: string[]
  activeBank: string | null
  onSelect: (bank: string | null) => void
  className?: string
  compact?: boolean
}

export function CashflowBankFilter({
  banks,
  activeBank,
  onSelect,
  className,
  compact,
}: CashflowBankFilterProps) {
  const { t } = useLanguage()
  if (banks.length <= 1) {
    return null
  }

  const buttonClass = cn("font-mono text-xs", compact && "h-5 px-2 py-0")

  return (
    <div className={className ?? "mb-4 flex flex-wrap gap-2"}>
      <Button
        variant={activeBank === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect(null)}
        className={buttonClass}
      >
        {t("cashflow.allBanks")}
      </Button>
      {banks.map((bank) => {
        const colorClass = getBankColorClass(bank, banks)

        return (
          <Button
            key={bank}
            variant={activeBank === bank ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(bank)}
            className={buttonClass}
          >
            <span className={cn("mr-2 inline-block h-2.5 w-2.5", colorClass)} />
            <span>{bank}</span>
          </Button>
        )
      })}
    </div>
  )
}
