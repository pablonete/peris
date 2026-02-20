"use client"

import { CashflowEntry } from "@/lib/types"
import { useLanguage } from "@/lib/i18n-context"

interface PeriodicityBadgeProps {
  periodicity?: CashflowEntry["periodicity"]
}

export function PeriodicityBadge({ periodicity }: PeriodicityBadgeProps) {
  const { t } = useLanguage()

  if (!periodicity) return null

  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center border border-current text-[12px] leading-none"
      title={t(`cashflow.periodicityLabel.${periodicity}`)}
      aria-label={t(`cashflow.periodicityLabel.${periodicity}`)}
    >
      {t(`cashflow.periodicity.${periodicity}`)}
    </span>
  )
}
