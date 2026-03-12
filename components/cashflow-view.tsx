"use client"

import { useState } from "react"
import { formatCurrency, formatDate } from "@/lib/ledger-utils"
import {
  getCashflowOpeningBalance,
  getCashflowClosingBalance,
  getBankColorClass,
} from "@/lib/cashflow-utils"
import {
  generateGhostEntries,
  GhostCashflowEntry,
  isGhostEntry,
} from "@/lib/ghost-entries"
import { getPreviousQuarterId, getYearAgoQuarterId } from "@/lib/quarter-utils"
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
import { CategoryMenu } from "@/components/cashflow/category-menu"
import { CashflowCategoryChart } from "@/components/cashflow-category-chart"
import { ImportCashflowDialog } from "@/components/cashflow/import-cashflow-dialog"
import { SummaryCard } from "@/components/summary-card"
import { EditingIndicator } from "@/components/editing-indicator"
import { PeriodicityBadge } from "@/components/periodicity-badge"
import { PeriodicityIconPicker } from "@/components/periodicity-icon-picker"
import {
  GhostEntrySourceCell,
  RegularEntrySourceCell,
} from "@/components/cashflow-cells"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n-context"
import { FileText, Receipt } from "lucide-react"

interface CashflowViewProps {
  quarterId: string
  onNavigateToQuarter?: (quarterId: string) => void
}

type DisplayEntry = CashflowEntry | GhostCashflowEntry

export function CashflowView({
  quarterId,
  onNavigateToQuarter,
}: CashflowViewProps) {
  const { t } = useLanguage()
  const {
    companyName,
    isDirtyFile,
    getEditingFile,
    setEditingFile,
    categories,
  } = useData()
  const { content, isPending, error } = useStorageData(quarterId, "cashflow")
  const isEditing = isDirtyFile(quarterId, "cashflow")

  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [showGhosts, setShowGhosts] = useState(false)

  const previousQuarterId = getPreviousQuarterId(quarterId)
  const yearAgoQuarterId = getYearAgoQuarterId(quarterId)

  const { content: previousQuarterContent } = useStorageData(
    previousQuarterId,
    "cashflow"
  )
  const { content: previousYearContent } = useStorageData(
    yearAgoQuarterId,
    "cashflow"
  )

  const entries = Array.isArray(content) ? content : []
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
        previousQuarterContent,
        previousYearContent,
        quarterId
      ).filter((g) => !activeBank || g.bankName === activeBank)
    : []

  const displayEntries: DisplayEntry[] = [...filteredEntries, ...ghostEntries]

  const handleAssignCategory = (
    entry: CashflowEntry,
    category: string | undefined
  ) => {
    const nextEntries = entries.map((e) =>
      e.id === entry.id ? { ...e, category } : e
    )
    const editingFile = getEditingFile(quarterId, "cashflow")
    setEditingFile(quarterId, "cashflow", nextEntries, editingFile?.sha)
  }

  const handleChangePeriodicity = (
    entry: CashflowEntry,
    periodicity: CashflowEntry["periodicity"]
  ) => {
    const nextEntries = entries.map((e) =>
      e.id === entry.id ? { ...e, periodicity } : e
    )
    const editingFile = getEditingFile(quarterId, "cashflow")
    setEditingFile(quarterId, "cashflow", nextEntries, editingFile?.sha)
  }

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-foreground">
            {t("cashflow.cashflow")}
            <EditingIndicator isEditing={isEditing} />
          </h2>
          <ImportCashflowDialog quarterId={quarterId} entries={entries} />
        </div>
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

      <div className="mb-4">
        <CashflowBankFilter
          banks={uniqueBanks}
          activeBank={activeBank}
          onSelect={setSelectedBank}
        />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayEntries.map((entry, idx) => {
              const ghost = isGhostEntry(entry)
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
                    {ghost ? (
                      <GhostEntrySourceCell
                        entry={entry as GhostCashflowEntry}
                        currentQuarterId={quarterId}
                      />
                    ) : (
                      <RegularEntrySourceCell
                        entry={entry as CashflowEntry}
                        uniqueBanks={uniqueBanks}
                        showBankColumn={showBankColumn}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <span className="flex items-center gap-2">
                      <span>{formatDate(entry.date)}</span>
                      {ghost ? (
                        <PeriodicityBadge periodicity={entry.periodicity} />
                      ) : !isCarryOver ? (
                        <PeriodicityIconPicker
                          periodicity={entry.periodicity}
                          onChangePeriodicity={(p) =>
                            handleChangePeriodicity(entry as CashflowEntry, p)
                          }
                        />
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className={cn("text-sm", isCarryOver && "italic")}>
                    {isCarryOver ? (
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
                          <span className="font-mono">{previousQuarterId}</span>
                        )}
                      </span>
                    ) : (
                      <div>
                        <span>{entry.concept}</span>
                        {categories.length > 0 && !ghost && (
                          <CategoryMenu
                            category={entry.category}
                            categories={categories}
                            onAssign={(cat) =>
                              handleAssignCategory(entry as CashflowEntry, cat)
                            }
                          />
                        )}
                        {ghost && entry.category && (
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
                    {formatCurrency(entry.balance)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="border-t-2 border-foreground/20 bg-secondary/30 hover:bg-secondary/30">
              <TableCell colSpan={4} className="font-semibold text-sm">
                <div className="flex items-center justify-between">
                  <span>Period totals</span>
                  <Button
                    variant={showGhosts ? "default" : "outline"}
                    size="sm"
                    className="h-6 shrink-0 px-2 font-mono text-[10px]"
                    onClick={() => setShowGhosts((v) => !v)}
                  >
                    {t("cashflow.predictEntries")}
                    {ghostEntries.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 px-1.5 font-mono text-[9px]"
                      >
                        {ghostEntries.length}
                      </Badge>
                    )}
                  </Button>
                </div>
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
    </div>
  )
}
