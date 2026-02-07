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
import { Badge } from "@/components/ui/badge"

interface ExpensesViewProps {
  quarterId: string
}

export function ExpensesView({ quarterId }: ExpensesViewProps) {
  const data = quarters[quarterId]
  if (!data) return null

  const totalSubtotal = data.expenses.reduce((s, e) => s + e.subtotal, 0)
  const totalVat = data.expenses.reduce((s, e) => s + e.vat, 0)
  const totalAmount = data.expenses.reduce((s, e) => s + e.total, 0)
  const deductibleTotal = data.expenses
    .filter((e) => e.deductible)
    .reduce((s, e) => s + e.total, 0)
  const nonDeductibleTotal = data.expenses
    .filter((e) => !e.deductible)
    .reduce((s, e) => s + e.total, 0)

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          Expenses
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {quarterId} &middot; {data.expenses.length} entries
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total expenses", value: totalAmount },
          { label: "Deductible", value: deductibleTotal },
          { label: "Non-deductible", value: nonDeductibleTotal },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-sm border border-border bg-card px-4 py-3"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
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
                Invoice
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Vendor
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Concept
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Subtotal
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                VAT
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Total
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-center">
                Deduct.
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.expenses.map((exp) => (
              <TableRow
                key={exp.id}
                className="border-b border-dashed border-[hsl(var(--ledger-line))] hover:bg-secondary/50"
              >
                <TableCell className="font-mono text-xs">
                  {formatDate(exp.date)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {exp.number ?? <span className="text-muted-foreground/50">{"\u2014"}</span>}
                </TableCell>
                <TableCell className="text-sm">{exp.vendor}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {exp.concept}
                </TableCell>
                <TableCell className="font-mono text-xs text-right">
                  {formatCurrency(exp.subtotal)}
                </TableCell>
                <TableCell className="font-mono text-xs text-right text-muted-foreground">
                  {exp.vat > 0 ? formatCurrency(exp.vat) : "\u2014"}
                </TableCell>
                <TableCell className="font-mono text-sm font-semibold text-right text-[hsl(var(--ledger-red))]">
                  {formatCurrency(exp.total)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      exp.deductible
                        ? "rounded-sm font-mono text-[10px] uppercase tracking-wider bg-[hsl(var(--ledger-green))] text-[hsl(var(--card))]"
                        : "rounded-sm font-mono text-[10px] uppercase tracking-wider bg-muted text-muted-foreground"
                    }
                  >
                    {exp.deductible ? "Yes" : "No"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="border-t-2 border-foreground/20 bg-secondary/30 hover:bg-secondary/30">
              <TableCell colSpan={4} className="font-semibold text-sm">
                Totals
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right">
                {formatCurrency(totalSubtotal)}
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right">
                {formatCurrency(totalVat)}
              </TableCell>
              <TableCell className="font-mono text-sm font-bold text-right text-[hsl(var(--ledger-red))]">
                {formatCurrency(totalAmount)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
