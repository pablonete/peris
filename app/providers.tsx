"use client"

import { LanguageProvider } from "@/lib/i18n-context"
import { StorageProvider } from "@/lib/storage-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StorageProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </StorageProvider>
  )
}
