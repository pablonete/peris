"use client"

import { LanguageProvider } from "@/lib/i18n-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>
}
