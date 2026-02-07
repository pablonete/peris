"use client";

import { quarters, formatCurrency, formatDate } from "@/lib/sample-data";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n-context";

interface InvoicesViewProps {
  quarterId: string;
}

const statusStyles: Record<string, string> = {
  paid: "bg-[hsl(var(--ledger-green))] text-[hsl(var(--card))]",
  pending: "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
  overdue: "bg-[hsl(var(--ledger-red))] text-[hsl(var(--card))]",
};

export function InvoicesView({ quarterId }: InvoicesViewProps) {
  const { t } = useLanguage();
  const data = quarters[quarterId];
  if (!data) return null;

  const totalSubtotal = data.invoices.reduce((s, i) => s + i.subtotal, 0);
  const totalVat = data.invoices.reduce((s, i) => s + i.vat, 0);
  const totalAmount = data.invoices.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          {t("invoices.sentInvoices")}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {quarterId} &middot; {data.invoices.length}{" "}
          {t("invoices.sentInvoices").toLowerCase()}
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t("invoices.totalInvoiced"), value: totalAmount },
          {
            label: t("invoices.collected"),
            value: data.invoices
              .filter((i) => i.status === "paid")
              .reduce((s, i) => s + i.total, 0),
          },
          {
            label: t("invoices.outstanding"),
            value: data.invoices
              .filter((i) => i.status !== "paid")
              .reduce((s, i) => s + i.total, 0),
          },
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
                {t("invoices.date")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                No.
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                {t("invoices.client")}
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
                {t("invoices.total")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-center">
                {t("invoices.status")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.invoices.map((inv) => (
              <TableRow
                key={inv.id}
                className="border-b border-dashed border-[hsl(var(--ledger-line))] hover:bg-secondary/50"
              >
                <TableCell className="font-mono text-xs">
                  {formatDate(inv.date)}
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold">
                  {inv.number}
                </TableCell>
                <TableCell className="text-sm">{inv.client}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {inv.concept}
                </TableCell>
                <TableCell className="font-mono text-xs text-right">
                  {formatCurrency(inv.subtotal)}
                </TableCell>
                <TableCell className="font-mono text-xs text-right text-muted-foreground">
                  {inv.vat > 0 ? formatCurrency(inv.vat) : "\u2014"}
                </TableCell>
                <TableCell className="font-mono text-sm font-semibold text-right">
                  {formatCurrency(inv.total)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={cn(
                      "rounded-sm text-[10px] font-mono uppercase tracking-wider",
                      statusStyles[inv.status],
                    )}
                  >
                    {t(`invoices.${inv.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="border-t-2 border-foreground/20 bg-secondary/30 hover:bg-secondary/30">
              <TableCell colSpan={4} className="font-semibold text-sm">
                {t("invoices.total")}s
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right">
                {formatCurrency(totalSubtotal)}
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-right">
                {formatCurrency(totalVat)}
              </TableCell>
              <TableCell className="font-mono text-sm font-bold text-right">
                {formatCurrency(totalAmount)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
