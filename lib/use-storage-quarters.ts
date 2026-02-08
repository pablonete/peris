"use client"

import { useEffect, useState } from "react"
import { useStorage } from "@/lib/storage-context"
import { listQuartersInStorage } from "@/lib/github-data"

interface StorageQuartersResult {
  quarters: string[]
  loading: boolean
  error: string | null
}

export function useStorageQuarters(): StorageQuartersResult {
  const { activeStorage } = useStorage()
  const [quarters, setQuarters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    listQuartersInStorage(activeStorage)
      .then((items) => {
        if (cancelled) {
          return
        }
        setQuarters(items)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) {
          return
        }
        setError(err instanceof Error ? err.message : "Unknown error")
        setQuarters([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeStorage])

  return { quarters, loading, error }
}
