"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useStorage } from "@/lib/storage-context"
import { useEditingState } from "@/lib/editing-state-context"
import { loadFileFromQuarter } from "@/lib/github-data"
import { Invoice, Expense, CashflowEntry } from "@/lib/types"

type LedgerFileName = "invoices" | "expenses" | "cashflow"

interface StorageDataResult<T> {
  content: T | null
  isPending: boolean
  error: Error | null
  isEditing: boolean
}

type UseStorageDataResult<T extends LedgerFileName> = T extends "invoices"
  ? StorageDataResult<Invoice[]>
  : T extends "expenses"
    ? StorageDataResult<Expense[]>
    : StorageDataResult<CashflowEntry[]>

/**
 * Helper to get the SHA for a file from the query cache
 */
export function useFileSha(
  quarterId: string | null,
  type: LedgerFileName
): string | undefined {
  const queryClient = useQueryClient()
  const { activeStorage } = useStorage()

  const queryKey = ["loadFile", activeStorage?.name, quarterId, type]
  const cachedData = queryClient.getQueryData<{ data: any; sha?: string }>(
    queryKey
  )

  return cachedData?.sha
}

export function useStorageData<T extends LedgerFileName>(
  quarterId: string | null,
  type: T
) {
  const { activeStorage } = useStorage()
  const { getEditingFile } = useEditingState()

  const editingFile = quarterId ? getEditingFile(quarterId, type) : undefined

  const query = useQuery({
    queryKey: ["loadFile", activeStorage?.name, quarterId, type],
    queryFn: () => loadFileFromQuarter(activeStorage, quarterId!, type),
    enabled: !!activeStorage && !!quarterId && !editingFile,
  })

  if (editingFile) {
    return {
      content: editingFile.data as any,
      isPending: false,
      error: null,
      isEditing: true,
    } as UseStorageDataResult<T>
  }

  return {
    content: query.data?.data ?? null,
    isPending: query.isPending,
    error: query.error || query.data?.error,
    isEditing: false,
  } as UseStorageDataResult<T>
}
