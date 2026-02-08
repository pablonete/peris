"use client"

import { formatCurrency } from "@/lib/ledger-utils"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  label: string
  value: number
  valueClassName?: string
}

export function SummaryCard({
  label,
  value,
  valueClassName,
}: SummaryCardProps) {
  const valueClasses = cn(
    "mt-1 font-mono text-xl font-semibold",
    valueClassName ? valueClassName : "text-foreground"
  )

  return (
    <div className="rounded-sm border border-border bg-card px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className={valueClasses}>{formatCurrency(value)}</p>
    </div>
  )
}
