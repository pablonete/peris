"use client"

import { useQuery } from "@tanstack/react-query"
import { useStorage } from "@/lib/storage-context"
import { loadPerisConfig } from "@/lib/github-data"
import { PerisConfig } from "@/lib/types"

export function usePerisConfig(): {
  config: PerisConfig | null
  categories: string[]
} {
  const { activeStorage } = useStorage()

  const query = useQuery({
    queryKey: ["perisConfig", activeStorage?.name],
    queryFn: () => loadPerisConfig(activeStorage!),
    enabled: !!activeStorage,
    staleTime: 5 * 60 * 1000,
  })

  const config = query.data?.data ?? null
  const categories = config?.categories ?? []

  return { config, categories }
}
