"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LanguageProvider } from "@/lib/i18n-context"
import { StorageProvider } from "@/lib/storage-context"
import { useMemo } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
          },
        },
      }),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </StorageProvider>
    </QueryClientProvider>
  )
}
