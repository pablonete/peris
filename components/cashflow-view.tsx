"use client"

import { useState } from "react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import { useStorage } from "@/lib/storage-context"
import { useStorageData } from "@/lib/use-storage-data"
import { useStorageQuarters } from "@/lib/use-storage-quarters"
import { useEditingState } from "@/lib/editing-state-context"
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
import { SummaryCard } from "@/components/summary-card"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n-context"
import { FileText, Receipt } from "lucide-react"

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
  const { getEditingFile } = useEditingState()
  const { content, isPending, error } = useStorageData(quarterId, "cashflow")
  const isEditing = !!getEditingFile(quarterId, "cashflow")

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
  const showBankColumn = hasMultipleBanks && activeBank === null

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
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-foreground">
          {t("cashflow.cashflow")}
          {isEditing && (
            <span
              className="h-2 w-2 rounded-full bg-green-600"
              aria-label="Editing"
            />
          )}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {quarterId} &middot; {activeStorage.name} &middot; {entries.length}{" "}
          {t("cashflow.movements")}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label={t("cashflow.opening")} value={openingBalance} />
        <SummaryCard
          label="Total income"
          value={totalIncome}
          valueClassName="text-[hsl(var(--ledger-green))]"
        />
        <SummaryCard
          label="Total outflow"
          value={totalExpense}
          valueClassName="text-[hsl(var(--ledger-red))]"
        />
        <SummaryCard label={t("cashflow.closing")} value={closingBalance} />
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
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                {showBankColumn ? t("cashflow.bank") : ""}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                {t("cashflow.month")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.15em]">
                Concept
              </TableHead>
              <TableHead className="w-[40px]" />
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
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-baseline gap-2">
                      {showBankColumn ? (
                        <span>{entry.bankName || "—"}</span>
                      ) : null}
                      <span className="font-mono text-[10px] text-muted-foreground/60">
                        {String(entry.bankSequence).padStart(4, "0")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <span>{formatDate(entry.date)}</span>
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
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {entry.invoiceId && (
                        <span className="inline-flex text-[hsl(var(--ledger-green))]">
                          <FileText className="h-4 w-4" />
                        </span>
                      )}
                      {entry.expenseId && (
                        <span className="inline-flex text-[hsl(var(--ledger-red))]">
                          <Receipt className="h-4 w-4" />
                        </span>
                      )}
                    </div>
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
              <TableCell colSpan={4} className="font-semibold text-sm">
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
