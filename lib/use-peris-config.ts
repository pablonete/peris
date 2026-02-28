"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useStorage } from "@/lib/storage-context"
import { useEditingState } from "@/lib/editing-state-context"
import { loadPerisConfig } from "@/lib/github-data"
import { PerisConfig } from "@/lib/types"

export function usePerisConfig(): {
  config: PerisConfig | null
  categories: string[]
} {
  const { activeStorage, isSample } = useStorage()
  const { editingConfig, setEditingConfig } = useEditingState()

  const query = useQuery({
    queryKey: ["perisConfig", activeStorage?.name],
    queryFn: () => loadPerisConfig(activeStorage!),
    enabled: !!activeStorage,
    staleTime: 5 * 60 * 1000,
  })

  const fetchedConfig = query.data?.data ?? null

  useEffect(() => {
    if (!isSample && query.isSuccess && fetchedConfig === null && editingConfig === null) {
      setEditingConfig({})
    }
  }, [isSample, query.isSuccess, fetchedConfig, editingConfig, setEditingConfig])

  const config = editingConfig?.data ?? fetchedConfig
  const categories = [...(config?.categories ?? [])].sort()

  return { config, categories }
}
