import { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LanguageProvider } from "@/lib/i18n-context"
import { StorageProvider } from "@/lib/storage-context"
import { EditingStateProvider } from "@/lib/editing-state-context"

export function TestProviders({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>
}

export function DataTestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>
        <EditingStateProvider>{children}</EditingStateProvider>
      </StorageProvider>
    </QueryClientProvider>
  )
}
