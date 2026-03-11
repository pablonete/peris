"use client"

import { useState, useRef } from "react"
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
import { X } from "lucide-react"

interface LinkingViewProps {
  quarterId: string
}

export function LinkingView({ quarterId }: LinkingViewProps) {
  const { t } = useLanguage()
  const { getEditingFile, setEditingFile } = useData()
  const cashflowSha = useFileSha(quarterId, "cashflow")

  const [linkingItemId, setLinkingItemId] = useState<string | null>(null)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  )
  const [linkingSourcePos, setLinkingSourcePos] = useState<{
    x: number
    y: number
  } | null>(null)

  const tableRef = useRef<HTMLDivElement>(null)

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

  const rows = buildLinkingRows(cashflow ?? [], invoices ?? [], expenses ?? [])

  // Orphan items (no cashflow yet) are always shown so they can be linked to any bank's entries
  const filteredRows = activeBank
    ? rows.filter(
        (row) => !row.cashflow || row.cashflow.bankName === activeBank
      )
    : rows

  const handleBankSelect = (bank: string | null) => {
    setSelectedBank(bank)
    setLinkingItemId(null)
    setLinkingSourcePos(null)
    setMousePos(null)
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
    setLinkingSourcePos(null)
    setMousePos(null)
  }

  const handleStartLinking = (
    e: React.MouseEvent<HTMLButtonElement>,
    itemId: string
  ) => {
    if (!tableRef.current) return
    const tableRect = tableRef.current.getBoundingClientRect()
    const circleRect = e.currentTarget.getBoundingClientRect()
    setLinkingSourcePos({
      x: circleRect.left + circleRect.width / 2 - tableRect.left,
      y: circleRect.top + circleRect.height / 2 - tableRect.top,
    })
    setLinkingItemId(itemId)
  }

  const handleCancelLinking = () => {
    setLinkingItemId(null)
    setLinkingSourcePos(null)
    setMousePos(null)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!linkingItemId || !tableRef.current) return
    const tableRect = tableRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - tableRect.left,
      y: e.clientY - tableRect.top,
    })
  }

  const handleMouseLeave = () => {
    setMousePos(null)
  }

  return (
    <div>
      <div className="mb-6 border-b-2 border-foreground/20 pb-4">
        <h2 className="text-2xl font-bold tracking-wide text-foreground">
          {t("linking.title")}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">{quarterId}</p>
      </div>

      <div
        ref={tableRef}
        className="rounded-sm border border-border bg-card overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex border-b-2 border-foreground/15">
          <div className="flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("linking.items")}
          </div>
          <div className="w-12 shrink-0" aria-hidden="true" />
          <div className="flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center justify-between gap-2">
            <span>{t("linking.cashflow")}</span>
            <CashflowBankFilter
              banks={uniqueBanks}
              activeBank={activeBank}
              onSelect={handleBankSelect}
              className="flex flex-wrap gap-1"
              compact
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("linking.emptyState")}
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-[hsl(var(--ledger-line))]">
            {filteredRows.map((row, idx) => {
              const isOrphanItem = !!row.item && !row.cashflow
              const isLinkingThisItem =
                isOrphanItem && row.item?.id === linkingItemId
              const isLinked =
                !!row.cashflow?.invoiceId || !!row.cashflow?.expenseId
              const isLinkableEntry =
                !!row.cashflow &&
                !row.cashflow.invoiceId &&
                !row.cashflow.expenseId
              const isZeroAmountItem =
                row.itemType === "expenses" &&
                (row.item as Expense | undefined)?.total === 0

              const itemCircleAction = isLinked
                ? () => handleRemoveLink(row.cashflow!)
                : isLinkingThisItem
                  ? handleCancelLinking
                  : isOrphanItem && !linkingItemId && !isZeroAmountItem
                    ? (e: React.MouseEvent<HTMLButtonElement>) =>
                        handleStartLinking(e, row.item!.id)
                    : undefined

              const cashflowCircleAction = isLinked
                ? () => handleRemoveLink(row.cashflow!)
                : linkingItemId && isLinkableEntry
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

              return (
                <div
                  key={row.cashflow?.id ?? row.item?.id ?? idx}
                  className="flex items-stretch"
                >
                  {/* Item cell */}
                  <div
                    className={cn(
                      "flex-1 px-3 min-h-[3.5rem]",
                      !row.item && "bg-secondary/10"
                    )}
                  >
                    {row.item && row.itemType === "invoices" && (
                      <InvoiceLinkingCell
                        invoice={row.item as Invoice}
                        quarterId={quarterId}
                      />
                    )}
                    {row.item && row.itemType === "expenses" && (
                      <ExpenseLinkingCell
                        expense={row.item as Expense}
                        quarterId={quarterId}
                      />
                    )}
                  </div>

                  {/* Connector: item circle — line — cashflow circle */}
                  <div className="w-12 shrink-0 flex items-center">
                    {/* Item-side circle */}
                    {row.item ? (
                      <button
                        className={cn(
                          "h-3 w-3 rounded-full border-2 shrink-0 group flex items-center justify-center transition-colors",
                          isLinked
                            ? "border-blue-500 cursor-pointer hover:border-destructive"
                            : isLinkingThisItem
                              ? "border-blue-400 cursor-pointer"
                              : isZeroAmountItem
                                ? "border-foreground/15 opacity-40 cursor-not-allowed"
                                : isOrphanItem && !linkingItemId
                                  ? "border-foreground/50 hover:border-foreground cursor-pointer"
                                  : "border-foreground/20 cursor-default"
                        )}
                        onClick={itemCircleAction}
                        disabled={isZeroAmountItem && !isLinked}
                        aria-label={
                          isLinked
                            ? t("linking.removeLink")
                            : isLinkingThisItem
                              ? t("linking.cancelLinking")
                              : isOrphanItem &&
                                  !linkingItemId &&
                                  !isZeroAmountItem
                                ? t("linking.startLinking")
                                : undefined
                        }
                        title={
                          isLinked
                            ? t("linking.removeLink")
                            : isLinkingThisItem
                              ? t("linking.cancelLinking")
                              : isOrphanItem &&
                                  !linkingItemId &&
                                  !isZeroAmountItem
                                ? t("linking.startLinking")
                                : undefined
                        }
                      >
                        {(isLinked || isLinkingThisItem) && (
                          <X className="h-2 w-2 text-current opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                    ) : (
                      <div className="h-3 w-3 shrink-0" />
                    )}

                    {/* Connecting line */}
                    <div
                      className={cn(
                        "flex-1 h-[2px]",
                        isLinked ? "bg-blue-500" : ""
                      )}
                    />

                    {/* Cashflow-side circle */}
                    {row.cashflow ? (
                      <button
                        className={cn(
                          "h-3 w-3 rounded-full border-2 shrink-0 group flex items-center justify-center transition-colors",
                          isLinked
                            ? "border-blue-500 cursor-pointer hover:border-destructive"
                            : linkingItemId && isLinkableEntry
                              ? "border-blue-400 cursor-pointer hover:border-blue-500"
                              : "border-foreground/20 cursor-default"
                        )}
                        onClick={cashflowCircleAction}
                        aria-label={
                          isLinked
                            ? t("linking.removeLink")
                            : linkingItemId && isLinkableEntry
                              ? t("linking.linkCashflow")
                              : undefined
                        }
                        title={
                          isLinked
                            ? t("linking.removeLink")
                            : linkingItemId && isLinkableEntry
                              ? t("linking.linkCashflow")
                              : undefined
                        }
                      >
                        {isLinked && (
                          <X className="h-2 w-2 text-current opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                    ) : (
                      <div className="h-3 w-3 shrink-0" />
                    )}
                  </div>

                  {/* Cashflow cell */}
                  <div
                    className={cn(
                      "flex-1 px-3 min-h-[3.5rem] border-l border-border",
                      !row.cashflow && "bg-secondary/10"
                    )}
                  >
                    {row.cashflow && (
                      <CashflowLinkingCell entry={row.cashflow} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SVG overlay: dashed line following mouse during linking */}
        {linkingItemId && linkingSourcePos && mousePos && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%" }}
            role="presentation"
            aria-hidden="true"
          >
            <line
              x1={linkingSourcePos.x}
              y1={linkingSourcePos.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>
        )}
      </div>
    </div>
  )
}
