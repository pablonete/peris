"use client"

import { CashflowEntry } from "@/lib/types"
import { GhostCashflowEntry } from "@/lib/ghost-entries"
import { getBankColorClass } from "@/lib/cashflow-utils"
import { cn } from "@/lib/utils"

interface RegularEntrySourceCellProps {
  entry: CashflowEntry
  uniqueBanks: string[]
  showBankColumn: boolean
}

export function RegularEntrySourceCell({
  entry,
  uniqueBanks,
  showBankColumn,
}: RegularEntrySourceCellProps) {
  return (
    <div className="flex items-baseline gap-2">
      {showBankColumn && (
        <>
          <span>{entry.bankName || "—"}</span>
          {entry.bankName && (
            <span
              className={cn(
                "inline-block h-2.5 w-2.5",
                getBankColorClass(entry.bankName, uniqueBanks)
              )}
            />
          )}
        </>
      )}
      {entry.bankSequence != null && (
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {String(entry.bankSequence).padStart(4, "0")}
        </span>
      )}
    </div>
  )
}

interface GhostEntrySourceCellProps {
  entry: GhostCashflowEntry
  currentQuarterId: string
}

export function GhostEntrySourceCell({
  entry,
  currentQuarterId,
}: GhostEntrySourceCellProps) {
  const originalSequence = entry.originalEntry.bankSequence || ""
  const paddedSequence = String(originalSequence).padStart(4, "0")
  const fromDifferentQuarter = entry.originalQuarterId !== currentQuarterId
  const ariaLabel = `Original entry${fromDifferentQuarter ? ` from ${entry.originalQuarterId}` : ""}, sequence ${paddedSequence}`

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono" aria-label={ariaLabel}>
        {fromDifferentQuarter && (
          <span className="mr-1">{entry.originalQuarterId}</span>
        )}
        {paddedSequence}
      </span>
    </div>
  )
}
