"use client"

import { formatCurrency } from "@/lib/ledger-utils"
import type { VatQuarterSummary } from "@/lib/vat-subtotals"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface VatSummarySectionProps {
  title: string
  typeLabel: string
  baseLabel: string
  quotaLabel: string
  summaries: VatQuarterSummary[]
}

export function VatSummarySection({
  title,
  typeLabel,
  baseLabel,
  quotaLabel,
  summaries,
}: VatSummarySectionProps) {
  if (summaries.length === 0) {
    return null
  }

  return (
    <section className="mt-6 rounded-sm border border-border bg-card w-fit">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 border-foreground/15 hover:bg-transparent">
            <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
              {typeLabel}
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
              {baseLabel}
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
              {quotaLabel}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow
              key={summary.rate}
              className="border-b border-dashed border-[hsl(var(--ledger-line))] hover:bg-secondary/50"
            >
              <TableCell className="font-mono text-xs">
                {summary.rate}%
              </TableCell>
              <TableCell className="font-mono text-xs text-right">
                {formatCurrency(summary.base)}
              </TableCell>
              <TableCell className="font-mono text-xs text-right">
                {formatCurrency(summary.quota)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
