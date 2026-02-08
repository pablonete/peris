"use client"

import { useQuery } from "@tanstack/react-query"
import { useStorage } from "@/lib/storage-context"
import { listQuartersInStorage } from "@/lib/github-data"

export function useStorageQuarters() {
  const { activeStorage } = useStorage()

  const query = useQuery({
    queryKey: ["loadQuartersList", activeStorage?.name],
    queryFn: () => listQuartersInStorage(activeStorage),
    enabled: !!activeStorage,
  })

  return {
    quarters: query.data || [],
    isPending: query.isPending,
    error: query.error,
  }
}
