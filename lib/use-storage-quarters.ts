"use client"

import { useQuery } from "@tanstack/react-query"
import { useStorage } from "@/lib/storage-context"
import { useEditingState } from "@/lib/editing-state-context"
import { listQuartersInStorage } from "@/lib/github-data"

export function useStorageQuarters() {
  const { activeStorage } = useStorage()
  const { editingFiles } = useEditingState()

  const query = useQuery({
    queryKey: ["loadQuartersList", activeStorage?.name],
    queryFn: () => listQuartersInStorage(activeStorage),
    enabled: !!activeStorage,
  })

  const githubQuarters = query.data || []

  const editingQuarters = Array.from(
    new Set(Array.from(editingFiles.values()).map((file) => file.quarterId))
  ).sort()

  const allQuarters = Array.from(
    new Set([...githubQuarters, ...editingQuarters])
  ).sort()

  return {
    quarters: allQuarters,
    isPending: query.isPending,
    error: query.error,
  }
}
