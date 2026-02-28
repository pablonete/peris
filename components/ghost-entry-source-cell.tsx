"use client"

import { GhostCashflowEntry } from "@/lib/ghost-entries"
import { getBankColorClass } from "@/lib/cashflow-utils"
import { cn } from "@/lib/utils"

interface GhostEntrySourceCellProps {
  entry: GhostCashflowEntry
  currentQuarterId: string
  uniqueBanks: string[]
  showBankColumn: boolean
}

export function GhostEntrySourceCell({
  entry,
  currentQuarterId,
  uniqueBanks,
  showBankColumn,
}: GhostEntrySourceCellProps) {
  const originalSequence = entry.originalEntry.bankSequence
  const fromDifferentQuarter = entry.originalQuarterId !== currentQuarterId

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
      {originalSequence != null && (
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {fromDifferentQuarter && (
            <span className="mr-1">{entry.originalQuarterId}</span>
          )}
          {String(originalSequence).padStart(4, "0")}
        </span>
      )}
    </div>
  )
}
