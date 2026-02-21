"use client"

import { useState } from "react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import {
  getCashflowOpeningBalance,
  getCashflowClosingBalance,
  getBankColorClass,
  generateGhostEntries,
  GhostCashflowEntry,
} from "@/lib/cashflow-utils"
import { useStorageData } from "@/lib/use-storage-data"
import { useData } from "@/lib/use-data"
import { CashflowEntry } from "@/lib/types"
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
import { Button } from "@/components/ui/button"
import { ErrorBanner } from "@/components/error-banner"
import { CashflowBankFilter } from "@/components/cashflow-bank-filter"
import { CashflowRowActions } from "@/components/cashflow-row-actions"
import { AssignCategoryDialog } from "@/components/assign-category-dialog"
import { CashflowCategoryChart } from "@/components/cashflow-category-chart"
import { SummaryCard } from "@/components/summary-card"
import { EditingIndicator } from "@/components/editing-indicator"
import { PeriodicityBadge } from "@/components/periodicity-badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n-context"
import { FileText, Receipt } from "lucide-react"

interface CashflowViewProps {
  quarterId: string
  onNavigateToQuarter?: (quarterId: string) => void
}

function getYearAgoQuarterId(quarterId: string): string {
  const match = quarterId.match(/^(\d{4})\.(\d)Q$/)
  if (!match) return quarterId
  return `${parseInt(match[1], 10) - 1}.${match[2]}Q`
}

type DisplayEntry = CashflowEntry | GhostCashflowEntry

function isGhost(entry: DisplayEntry): entry is GhostCashflowEntry {
  return "isGhost" in entry && entry.isGhost === true
}

export function CashflowView({
  quarterId,
  onNavigateToQuarter,
}: CashflowViewProps) {
  const { t } = useLanguage()
  const {
    companyName,
    quarters,
    isDirtyFile,
    getEditingFile,
    setEditingFile,
    categories,
  } = useData()
  const { content, isPending, error } = useStorageData(quarterId, "cashflow")
  const isEditing = isDirtyFile(quarterId, "cashflow")

  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [assignCategoryEntry, setAssignCategoryEntry] =
    useState<CashflowEntry | null>(null)
  const [showGhosts, setShowGhosts] = useState(false)

  const currentQuarterIndex = quarters.indexOf(quarterId)
  const previousQuarterId =
    currentQuarterIndex > 0 ? quarters[currentQuarterIndex - 1] : null
  const yearAgoQuarterId = getYearAgoQuarterId(quarterId)

  const { content: previousContent } = useStorageData(
    previousQuarterId,
    "cashflow"
  )
  const { content: yearAgoContent } = useStorageData(
    yearAgoQuarterId,
    "cashflow"
  )

  const entries = content ?? []
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
  const showEllipsis = categories.length > 0

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

  // Filter entries by selected bank
  const filteredEntries = activeBank
    ? entries.filter((entry) => entry.bankName === activeBank)
    : entries

  const totalIncome = filteredEntries.reduce((s, e) => s + (e.income ?? 0), 0)
  const totalExpense = filteredEntries.reduce((s, e) => s + (e.expense ?? 0), 0)
  const openingBalance = getCashflowOpeningBalance(
    activeBank ? filteredEntries : entries
  )
  const calculatedClosingBalance = openingBalance + totalIncome - totalExpense
  const actualClosingBalance = getCashflowClosingBalance(
    activeBank ? filteredEntries : entries
  )
  const balanceDifference = actualClosingBalance - calculatedClosingBalance
  const balanceMismatch = Math.abs(balanceDifference) >= 0.005

  const ghostEntries: GhostCashflowEntry[] = showGhosts
    ? generateGhostEntries(
        entries,
        previousContent ?? [],
        yearAgoContent ?? [],
        quarterId
      ).filter((g) => !activeBank || g.bankName === activeBank)
    : []

  const displayEntries: DisplayEntry[] = [...filteredEntries, ...ghostEntries]

  const handleAssignCategory = (category: string | undefined) => {
    if (!assignCategoryEntry) return
    const nextEntries = entries.map((e) =>
      e.id === assignCategoryEntry.id ? { ...e, category } : e
    )
    const editingFile = getEditingFile(quarterId, "cashflow")
    setEditingFile(quarterId, "cashflow", nextEntries, editingFile?.sha)
    setAssignCategoryEntry(null)
  }

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-foreground">
          {t("cashflow.cashflow")}
          <EditingIndicator isEditing={isEditing} />
        </h2>
        <p className="font-mono text-xs text-muted-foreground">
          {quarterId} &middot; {companyName} &middot; {entries.length}{" "}
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
        <SummaryCard
          label={t("cashflow.closing")}
          value={actualClosingBalance}
        />
      </div>

      {balanceMismatch && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {t("cashflow.balanceMismatch")
              .replace("{expected}", formatCurrency(calculatedClosingBalance))
              .replace("{actual}", formatCurrency(actualClosingBalance))
              .replace("{diff}", formatCurrency(Math.abs(balanceDifference)))
              .replace(
                "{direction}",
                balanceDifference > 0 ? t("cashflow.over") : t("cashflow.under")
              )}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex items-center justify-between gap-4">
        <CashflowBankFilter
          banks={uniqueBanks}
          activeBank={activeBank}
          onSelect={setSelectedBank}
        />
        <Button
          variant={showGhosts ? "default" : "outline"}
          size="sm"
          className="h-6 shrink-0 px-2 font-mono text-[10px]"
          onClick={() => setShowGhosts((v) => !v)}
        >
          {t("cashflow.showGhostEntries")}
        </Button>
      </div>

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
              {showEllipsis && <TableHead className="w-[40px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayEntries.map((entry, idx) => {
              const ghost = isGhost(entry)
              const isCarryOver =
                !ghost && idx === 0 && entry.concept === "Carry over"
              return (
                <TableRow
                  key={entry.id}
                  className={cn(
                    "border-b border-dashed border-[hsl(var(--ledger-line))] hover:bg-secondary/50",
                    isCarryOver && "bg-secondary/40 font-semibold",
                    ghost && "opacity-40"
                  )}
                >
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-baseline gap-2">
                      {showBankColumn ? (
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
                      ) : null}
                      {!ghost && entry.bankSequence != null ? (
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          {String(entry.bankSequence).padStart(4, "0")}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <span className="flex items-center gap-2">
                      <span>{formatDate(entry.date)}</span>
                      <PeriodicityBadge periodicity={entry.periodicity} />
                    </span>
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
                      <div>
                        <span>{entry.concept}</span>
                        {entry.category && (
                          <span className="font-mono text-[10px] text-muted-foreground/70 mt-0.5 block">
                            {entry.category}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {!ghost && entry.invoiceId && (
                        <span className="inline-flex text-[hsl(var(--ledger-green))]">
                          <FileText className="h-4 w-4" />
                        </span>
                      )}
                      {!ghost && entry.expenseId && (
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
                    {ghost ? "—" : formatCurrency(entry.balance)}
                  </TableCell>
                  {showEllipsis && (
                    <TableCell className="text-center">
                      {!ghost && (
                        <CashflowRowActions
                          onAssignCategory={() =>
                            setAssignCategoryEntry(entry as CashflowEntry)
                          }
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="border-t-2 border-foreground/20 bg-secondary/30 hover:bg-secondary/30">
              <TableCell
                colSpan={showEllipsis ? 5 : 4}
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
                {formatCurrency(actualClosingBalance)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <CashflowCategoryChart entries={filteredEntries} />

      {assignCategoryEntry && (
        <AssignCategoryDialog
          open={assignCategoryEntry !== null}
          onClose={() => setAssignCategoryEntry(null)}
          onAssign={handleAssignCategory}
          categories={categories}
          currentCategory={assignCategoryEntry.category}
        />
      )}
    </div>
  )
}
