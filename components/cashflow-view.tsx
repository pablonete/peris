"use client"

import { quarters, formatCurrency, formatDate } from "@/lib/sample-data"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface CashflowViewProps {
  quarterId: string
}

export function CashflowView({ quarterId }: CashflowViewProps) {
  const data = quarters[quarterId]
  if (!data) return null

  const totalIncome = data.cashflow.reduce((s, e) => s + (e.income ?? 0), 0)
  const totalExpense = data.cashflow.reduce((s, e) => s + (e.expense ?? 0), 0)
  const openingBalance = data.carryOver
  const closingBalance = data.cashflow[data.cashflow.length - 1]?.balance ?? openingBalance

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          Cashflow
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {quarterId} &middot; Bank Unicaja
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Opening balance", value: openingBalance, color: "" },
          { label: "Total income", value: totalIncome, color: "text-[hsl(var(--ledger-green))]" },
          { label: "Total outflow", value: totalExpense, color: "text-[hsl(var(--ledger-red))]" },
          { label: "Closing balance", value: closingBalance, color: "" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-sm border border-border bg-card px-4 py-3"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {card.label}
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-xl font-semibold",
                card.color || "text-foreground"
              )}
            >
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Ledger table */}
      <div className="rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-foreground/15 hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Date
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Concept
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Ref.
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Income
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Expense
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Balance
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.cashflow.map((entry, idx) => {
              const isCarryOver = idx === 0 && entry.concept === "Carry over"
              return (
                <TableRow
                  key={entry.id}
                  className={cn(
                    "border-b border-dashed border-[hsl(var(--ledger-line))] hover:bg-secondary/50",
                    isCarryOver && "bg-secondary/40 font-semibold"
                  )}
                >
                  <TableCell className="font-mono text-xs">
                    {formatDate(entry.date)}
                  </TableCell>
                  <TableCell className={cn("text-sm", isCarryOver && "italic")}>
                    {entry.concept}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">
                    {entry.reference ?? ""}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    {entry.income != null ? (
                      <span className="text-[hsl(var(--ledger-green))] font-semibold">
                        {formatCurrency(entry.income)}
                      </span>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right">
                    {entry.expense != null ? (
                      <span className="text-[hsl(var(--ledger-red))]">
                        {formatCurrency(entry.expense)}
                      </span>
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold text-right">
                    {formatCurrency(entry.balance)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="border-t-2 border-foreground/20 bg-secondary/30 hover:bg-secondary/30">
              <TableCell colSpan={3} className="font-semibold text-sm">
                Period totals
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right text-[hsl(var(--ledger-green))]">
                {formatCurrency(totalIncome)}
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right text-[hsl(var(--ledger-red))]">
                {formatCurrency(totalExpense)}
              </TableCell>
              <TableCell className="font-mono text-sm font-bold text-right">
                {formatCurrency(closingBalance)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
