"use client"

import { useEffect, useState } from "react"
import { useStorage } from "@/lib/storage-context"
import { loadFileFromQuarter } from "@/lib/github-data"
import { Invoice, Expense } from "@/lib/types"
import { CashflowFileData } from "@/lib/github-storage"
import { quarters } from "@/lib/sample-data"

const SAMPLE_STORAGE_URL = "https://github.com/pablonete/peris-sample-data"

type LedgerFileName = "invoices" | "expenses" | "cashflow"

interface StorageDataResult<T> {
  content: T
  loading: boolean
  error: string | null
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
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sampleData = quarters[quarterId]

  useEffect(() => {
    if (activeStorage.url === SAMPLE_STORAGE_URL) {
      if (type === "invoices") {
        setData(sampleData?.invoices || [])
      } else if (type === "expenses") {
        setData(sampleData?.expenses || [])
      } else if (type === "cashflow") {
        setData({
          companyName: sampleData?.companyName || "Unknown Company",
          carryOver: sampleData?.carryOver || 0,
          entries: sampleData?.cashflow || [],
        })
      }
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    loadFileFromQuarter(activeStorage, quarterId, type)
      .then((result) => {
        setData(result.data || null)
        setError(result.error || null)
        setLoading(false)
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unknown error loading data"
        )
        setData(null)
        setLoading(false)
      })
  }, [activeStorage, quarterId, sampleData, type])

  return {
    content: data,
    loading,
    error,
  } as UseStorageDataResult<T>
}
