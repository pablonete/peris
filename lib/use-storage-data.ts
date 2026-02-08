"use client"

import { useQuery } from "@tanstack/react-query"
import { useStorage } from "@/lib/storage-context"
import { loadFileFromQuarter } from "@/lib/github-data"
import { Invoice, Expense } from "@/lib/types"
import { CashflowFileData } from "@/lib/github-storage"

type LedgerFileName = "invoices" | "expenses" | "cashflow"

interface StorageDataResult<T> {
  content: T | null
  isPending: boolean
  error: Error | null
}

type UseStorageDataResult<T extends LedgerFileName> = T extends "invoices"
  ? StorageDataResult<Invoice[]>
  : T extends "expenses"
    ? StorageDataResult<Expense[]>
    : StorageDataResult<CashflowFileData>

export function useStorageData<T extends LedgerFileName>(
  quarterId: string,
  type: T
) {
  const { activeStorage } = useStorage()

  const query = useQuery({
    queryKey: ["loadFile", activeStorage?.name, quarterId, type],
    queryFn: () => loadFileFromQuarter(activeStorage, quarterId, type),
    enabled: !!activeStorage,
    select: (result) => result.data,
  })

  return {
    content: query.data,
    isPending: query.isPending,
    error: query.error,
  } as UseStorageDataResult<T>
}
