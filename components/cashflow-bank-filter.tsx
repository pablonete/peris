"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n-context"

interface CashflowBankFilterProps {
  banks: string[]
  activeBank: string | null
  onSelect: (bank: string | null) => void
}

export function CashflowBankFilter({
  banks,
  activeBank,
  onSelect,
}: CashflowBankFilterProps) {
  const { t } = useLanguage()
  if (banks.length <= 1) {
    return null
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Button
        variant={activeBank === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect(null)}
        className="font-mono text-xs"
      >
        {t("cashflow.allBanks")}
      </Button>
      {banks.map((bank) => (
        <Button
          key={bank}
          variant={activeBank === bank ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(bank)}
          className="font-mono text-xs"
        >
          {bank}
        </Button>
      ))}
    </div>
  )
}
