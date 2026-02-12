"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LanguageProvider } from "@/lib/i18n-context"
import { DataProvider } from "@/lib/data"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useMemo } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
          },
        },
      }),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <LanguageProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </LanguageProvider>
      </DataProvider>
    </QueryClientProvider>
  )
}
