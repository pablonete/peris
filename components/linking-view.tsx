"use client"

import { useState, useRef } from "react"
import { useStorageData, useFileSha } from "@/lib/use-storage-data"
import { useLanguage } from "@/lib/i18n-context"
import { useData } from "@/lib/use-data"
import { ErrorBanner } from "@/components/error-banner"
import { Invoice, Expense, CashflowEntry } from "@/lib/types"
import { buildLinkingRows, LinkedItemType } from "@/lib/linking-utils"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/ledger-utils"
import { InvoiceLinkingCell } from "@/components/invoices/invoice-linking-cell"
import { ExpenseLinkingCell } from "@/components/expenses/expense-linking-cell"
import { CashflowLinkingCell } from "@/components/cashflow/cashflow-linking-cell"
import { CashflowBankFilter } from "@/components/cashflow-bank-filter"
import { LinkingCircle } from "@/components/linking/linking-circle"
import { Toggle } from "@/components/ui/toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LinkingViewProps {
  quarterId: string
}

export function LinkingView({ quarterId }: LinkingViewProps) {
  const { t } = useLanguage()
  const { getEditingFile, setEditingFile } = useData()
  const cashflowSha = useFileSha(quarterId, "cashflow")

  const [linkingItemId, setLinkingItemId] = useState<string | null>(null)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [showOrphansOnly, setShowOrphansOnly] = useState(false)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  )
  const [linkingSourcePos, setLinkingSourcePos] = useState<{
    x: number
    y: number
  } | null>(null)
  const [pendingLink, setPendingLink] = useState<{
    entry: CashflowEntry
    itemId: string
    itemType: LinkedItemType
    mismatch: number
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
  const filteredRows = (
    activeBank
      ? rows.filter(
          (row) => !row.cashflow || row.cashflow.bankName === activeBank
        )
      : rows
  ).filter((row) =>
    showOrphansOnly
      ? !(row.cashflow?.invoiceId || row.cashflow?.expenseId)
      : true
  )

  const handleOrphansToggle = (pressed: boolean) => {
    setShowOrphansOnly(pressed)
    setLinkingItemId(null)
    setLinkingSourcePos(null)
    setMousePos(null)
  }

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

  const handleTryLinkCashflow = (
    entry: CashflowEntry,
    itemId: string,
    itemType: LinkedItemType
  ) => {
    const allItems = [...(invoices ?? []), ...(expenses ?? [])]
    const item = allItems.find((i) => i.id === itemId)
    const itemAmount = item ? (item as Invoice | Expense).total : 0
    const cashflowAmount =
      itemType === "invoices" ? (entry.income ?? 0) : (entry.expense ?? 0)
    const mismatch = Math.abs(itemAmount - cashflowAmount)
    // Tolerance to avoid false positives from floating-point rounding
    const tolerance = 0.001

    if (mismatch > tolerance) {
      setPendingLink({ entry, itemId, itemType, mismatch })
    } else {
      handleLinkCashflow(entry, itemId, itemType)
    }
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

  const handleTableClick = () => {
    if (linkingItemId) {
      handleCancelLinking()
    }
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
        onClick={handleTableClick}
      >
        <div className="flex border-b-2 border-foreground/15">
          <div className="flex-1 border-r border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center justify-between gap-2">
            <span>{t("linking.items")}</span>
            <Toggle
              pressed={showOrphansOnly}
              onPressedChange={handleOrphansToggle}
              size="sm"
              variant="outline"
              className="h-5 px-2 py-0 font-mono text-[10px] uppercase tracking-[0.15em]"
            >
              {t("linking.orphansOnly")}
            </Toggle>
          </div>
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
                ? linkingItemId
                  ? undefined
                  : () => handleRemoveLink(row.cashflow!)
                : isLinkingThisItem
                  ? handleCancelLinking
                  : isOrphanItem && !linkingItemId && !isZeroAmountItem
                    ? (e: React.MouseEvent<HTMLButtonElement>) =>
                        handleStartLinking(e, row.item!.id)
                    : undefined

              const cashflowCircleAction = isLinked
                ? linkingItemId
                  ? undefined
                  : () => handleRemoveLink(row.cashflow!)
                : linkingItemId && isLinkableEntry
                  ? () => {
                      const linkingRow = rows.find(
                        (r) => r.item?.id === linkingItemId
                      )
                      if (linkingRow?.itemType) {
                        handleTryLinkCashflow(
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
                  {/* Item cell — content + circle on right edge */}
                  <div
                    className={cn(
                      "flex-1 min-h-[3.5rem] flex items-center",
                      !row.item && "bg-secondary/10"
                    )}
                  >
                    <div className="flex-1 min-w-0 px-3">
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
                    {row.item && (
                      <LinkingCircle
                        side="left"
                        isLinked={isLinked}
                        isLinkingSource={isLinkingThisItem}
                        isLinkableTarget={false}
                        isDisabled={
                          (isZeroAmountItem && !isLinked) ||
                          (!!linkingItemId && isLinked)
                        }
                        onClick={itemCircleAction}
                        ariaLabel={
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
                      />
                    )}
                  </div>

                  {/* Cashflow cell — circle on left edge + content */}
                  <div
                    className={cn(
                      "flex-1 min-h-[3.5rem] flex items-center border-l border-border",
                      !row.cashflow && "bg-secondary/10"
                    )}
                  >
                    {row.cashflow && (
                      <LinkingCircle
                        side="right"
                        isLinked={isLinked}
                        isLinkingSource={false}
                        isLinkableTarget={!!(linkingItemId && isLinkableEntry)}
                        isDisabled={!!linkingItemId && isLinked}
                        onClick={cashflowCircleAction}
                        ariaLabel={
                          isLinked
                            ? t("linking.removeLink")
                            : linkingItemId && isLinkableEntry
                              ? t("linking.linkCashflow")
                              : undefined
                        }
                      />
                    )}
                    <div className="flex-1 min-w-0 px-3">
                      {row.cashflow && (
                        <CashflowLinkingCell entry={row.cashflow} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

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

      <AlertDialog
        open={!!pendingLink}
        onOpenChange={(open) => !open && setPendingLink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("linking.mismatchTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingLink &&
                `${t("linking.mismatchDesc")} ${formatCurrency(pendingLink.mismatch)}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={() => setPendingLink(null)}>
              {t("linking.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingLink) {
                  handleLinkCashflow(
                    pendingLink.entry,
                    pendingLink.itemId,
                    pendingLink.itemType
                  )
                  setPendingLink(null)
                }
              }}
            >
              {t("linking.mismatchConfirm")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
