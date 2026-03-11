"use client"

import { useState } from "react"
import { useStorageData, useFileSha } from "@/lib/use-storage-data"
import { useLanguage } from "@/lib/i18n-context"
import { useData } from "@/lib/use-data"
import { ErrorBanner } from "@/components/error-banner"
import { Invoice, Expense, CashflowEntry } from "@/lib/types"
import { buildLinkingRows, LinkedItemType } from "@/lib/linking-utils"
import { cn } from "@/lib/utils"
import { InvoiceLinkingCell } from "@/components/invoices/invoice-linking-cell"
import { ExpenseLinkingCell } from "@/components/expenses/expense-linking-cell"
import { CashflowLinkingCell } from "@/components/cashflow/cashflow-linking-cell"
import { CashflowBankFilter } from "@/components/cashflow-bank-filter"

interface LinkingViewProps {
  quarterId: string
}

export function LinkingView({ quarterId }: LinkingViewProps) {
  const { t } = useLanguage()
  const { getEditingFile, setEditingFile } = useData()
  const cashflowSha = useFileSha(quarterId, "cashflow")

  const [linkingItemId, setLinkingItemId] = useState<string | null>(null)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)

  const {
    content: invoices,
    isPending: invoicesPending,
    error: invoicesError,
  } = useStorageData(quarterId, "invoices")
  const {
    content: expenses,
    isPending: expensesPending,
    error: expensesError,
  } = useStorageData(quarterId, "expenses")
  const {
    content: cashflow,
    isPending: cashflowPending,
    error: cashflowError,
  } = useStorageData(quarterId, "cashflow")

  const isPending = invoicesPending || expensesPending || cashflowPending
  const error = invoicesError || expensesError || cashflowError

  if (isPending) {
    return (
      <div className="text-center text-muted-foreground">
        {t("linking.title")}...
      </div>
    )
  }

  if (error) {
    return <ErrorBanner title={t("linking.title")} message={error.message} />
  }

  const uniqueBanks = Array.from(
    new Set(
      (cashflow ?? [])
        .map((entry) => entry.bankName)
        .filter((name): name is string => Boolean(name))
    )
  ).sort()
  const hasMultipleBanks = uniqueBanks.length > 1
  const activeBank =
    hasMultipleBanks && selectedBank && uniqueBanks.includes(selectedBank)
      ? selectedBank
      : null

  const filteredCashflow = activeBank
    ? (cashflow ?? []).filter((e) => e.bankName === activeBank)
    : (cashflow ?? [])

  const rows = buildLinkingRows(
    filteredCashflow,
    invoices ?? [],
    expenses ?? []
  )

  const handleBankSelect = (bank: string | null) => {
    setSelectedBank(bank)
    setLinkingItemId(null)
  }

  const updateCashflow = (updatedEntries: CashflowEntry[]) => {
    const sha = getEditingFile(quarterId, "cashflow")?.sha ?? cashflowSha
    setEditingFile(quarterId, "cashflow", updatedEntries, sha)
  }

  const patchCashflowEntry = (
    entry: CashflowEntry,
    patch: Partial<CashflowEntry>
  ) => {
    updateCashflow(
      (cashflow ?? []).map((e) => (e.id === entry.id ? { ...e, ...patch } : e))
    )
  }

  const handleRemoveLink = (entry: CashflowEntry) => {
    patchCashflowEntry(entry, { invoiceId: undefined, expenseId: undefined })
  }

  const handleLinkCashflow = (
    entry: CashflowEntry,
    itemId: string,
    itemType: LinkedItemType
  ) => {
    patchCashflowEntry(entry, {
      invoiceId: itemType === "invoices" ? itemId : undefined,
      expenseId: itemType === "expenses" ? itemId : undefined,
    })
    setLinkingItemId(null)
  }

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          {t("linking.title")}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">{quarterId}</p>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="flex border-b-2 border-foreground/15">
          <div className="flex-1 border-r border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("linking.items")}
          </div>
          <div className="flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center justify-between gap-2">
            <span>{t("linking.cashflow")}</span>
            <CashflowBankFilter
              banks={uniqueBanks}
              activeBank={activeBank}
              onSelect={handleBankSelect}
              className="flex flex-wrap gap-1"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("linking.emptyState")}
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-[hsl(var(--ledger-line))]">
            {rows.map((row, idx) => {
              const isOrphanItem = !!row.item && !row.cashflow
              const isLinkingThisItem =
                isOrphanItem && row.item?.id === linkingItemId
              const isLinked =
                !!row.cashflow?.invoiceId || !!row.cashflow?.expenseId
              const isLinkableEntry =
                !!row.cashflow &&
                !row.cashflow.invoiceId &&
                !row.cashflow.expenseId

              return (
                <div
                  key={row.cashflow?.id ?? row.item?.id ?? idx}
                  className="flex"
                >
                  <div
                    className={cn(
                      "flex-1 border-r border-border px-3 min-h-[3.5rem]",
                      !row.item && "bg-secondary/10"
                    )}
                  >
                    {row.item && row.itemType === "invoices" && (
                      <InvoiceLinkingCell
                        invoice={row.item as Invoice}
                        quarterId={quarterId}
                        onStartLinking={
                          isOrphanItem && !linkingItemId
                            ? () => setLinkingItemId(row.item!.id)
                            : undefined
                        }
                        onCancelLinking={
                          isLinkingThisItem
                            ? () => setLinkingItemId(null)
                            : undefined
                        }
                      />
                    )}
                    {row.item && row.itemType === "expenses" && (
                      <ExpenseLinkingCell
                        expense={row.item as Expense}
                        quarterId={quarterId}
                        onStartLinking={
                          isOrphanItem && !linkingItemId
                            ? () => setLinkingItemId(row.item!.id)
                            : undefined
                        }
                        onCancelLinking={
                          isLinkingThisItem
                            ? () => setLinkingItemId(null)
                            : undefined
                        }
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 px-3 min-h-[3.5rem]",
                      !row.cashflow && "bg-secondary/10"
                    )}
                  >
                    {row.cashflow && (
                      <CashflowLinkingCell
                        entry={row.cashflow}
                        onRemoveLink={
                          isLinked
                            ? () => handleRemoveLink(row.cashflow!)
                            : undefined
                        }
                        onLink={
                          linkingItemId && isLinkableEntry
                            ? () => {
                                const linkingRow = rows.find(
                                  (r) => r.item?.id === linkingItemId
                                )
                                if (linkingRow?.itemType) {
                                  handleLinkCashflow(
                                    row.cashflow!,
                                    linkingItemId,
                                    linkingRow.itemType
                                  )
                                }
                              }
                            : undefined
                        }
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
