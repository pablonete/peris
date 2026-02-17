import { ReactNode } from "react"
import { LanguageProvider } from "@/lib/i18n-context"

export function TestProviders({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>
}
