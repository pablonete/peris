"use client"

import { useState } from "react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useStorage } from "@/lib/storage-context"
import { useStorageData } from "@/lib/use-storage-data"
import { useStorageQuarters } from "@/lib/use-storage-quarters"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ErrorBanner } from "@/components/error-banner"
import { CashflowBankFilter } from "@/components/cashflow-bank-filter"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n-context"

interface CashflowViewProps {
  quarterId: string
  onNavigateToQuarter?: (quarterId: string) => void
}

export function CashflowView({
  quarterId,
  onNavigateToQuarter,
}: CashflowViewProps) {
  const { t } = useLanguage()
  const { activeStorage } = useStorage()
  const { quarters } = useStorageQuarters()
  const { content, isPending, error } = useStorageData(quarterId, "cashflow")

  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const entries = content?.entries ?? []
  const uniqueBanks = Array.from(
    new Set(
      entries
        .map((entry) => entry.bankName)
        .filter((name): name is string => Boolean(name))
    )
  ).sort()
  const hasMultipleBanks = uniqueBanks.length > 1
  const activeBank =
    hasMultipleBanks && selectedBank && uniqueBanks.includes(selectedBank)
      ? selectedBank
      : null

  if (isPending) {
    return (
      <div className="text-center text-muted-foreground">
        {t("cashflow.cashflow")}...
      </div>
    )
  }

  if (error) {
    return <ErrorBanner title={t("sidebar.cashflow")} message={error.message} />
  }

  if (!content) {
    return (
      <Alert>
        <AlertDescription>No cashflow data found</AlertDescription>
      </Alert>
    )
  }

  const currentQuarterIndex = quarters.indexOf(quarterId)
  const previousQuarterId =
    currentQuarterIndex > 0 ? quarters[currentQuarterIndex - 1] : null

  // Filter entries by selected bank
  const filteredEntries = activeBank
    ? entries.filter((entry) => entry.bankName === activeBank)
    : entries

  const totalIncome = filteredEntries.reduce((s, e) => s + (e.income ?? 0), 0)
  const totalExpense = filteredEntries.reduce((s, e) => s + (e.expense ?? 0), 0)
  const openingBalance = content?.carryOver ?? 0
  const closingBalance =
    filteredEntries[filteredEntries.length - 1]?.balance ?? openingBalance

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          {t("cashflow.cashflow")}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {quarterId} &middot; {activeStorage.name} &middot; {entries.length}{" "}
          {t("cashflow.movements")}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: t("cashflow.opening"), value: openingBalance, color: "" },
          {
            label: "Total income",
            value: totalIncome,
            color: "text-[hsl(var(--ledger-green))]",
          },
          {
            label: "Total outflow",
            value: totalExpense,
            color: "text-[hsl(var(--ledger-red))]",
          },
          { label: t("cashflow.closing"), value: closingBalance, color: "" },
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

      <CashflowBankFilter
        banks={uniqueBanks}
        activeBank={activeBank}
        onSelect={setSelectedBank}
      />

      <div className="rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-foreground/15 hover:bg-transparent">
              {hasMultipleBanks && (
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                  {t("cashflow.bank")}
                </TableHead>
              )}
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                {t("cashflow.month")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Concept
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                {t("cashflow.invoiced")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                {t("cashflow.expenses")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em] text-right">
                Balance
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry, idx) => {
              const isCarryOver = idx === 0 && entry.concept === "Carry over"
              return (
                <TableRow
                  key={entry.id}
                  className={cn(
                    "border-b border-dashed border-[hsl(var(--ledger-line))] hover:bg-secondary/50",
                    isCarryOver && "bg-secondary/40 font-semibold"
                  )}
                >
                  {hasMultipleBanks && (
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.bankName || "—"}
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground/60">
                        {String(entry.bankSequence).padStart(4, "0")}
                      </span>
                      <span>{formatDate(entry.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn("text-sm", isCarryOver && "italic")}>
                    {isCarryOver ? (
                      previousQuarterId ? (
                        <span>
                          {t("cashflow.carryOverFrom")}{" "}
                          {onNavigateToQuarter ? (
                            <button
                              type="button"
                              onClick={() =>
                                onNavigateToQuarter(previousQuarterId)
                              }
                              className="font-mono underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground/70"
                              aria-label={`${t("cashflow.carryOverFrom")} ${previousQuarterId}`}
                            >
                              {previousQuarterId}
                            </button>
                          ) : (
                            <span className="font-mono">
                              {previousQuarterId}
                            </span>
                          )}
                        </span>
                      ) : (
                        t("cashflow.carryOver")
                      )
                    ) : (
                      entry.concept
                    )}
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
              <TableCell
                colSpan={hasMultipleBanks ? 3 : 2}
                className="font-semibold text-sm"
              >
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
