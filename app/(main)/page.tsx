"use client"

import { WelcomeView } from "@/components/welcome-view"
import { useRouter } from "next/navigation"
import type { ViewType } from "@/components/ledger-sidebar"

export default function WelcomePage() {
  const router = useRouter()

  function handleNavigate(quarter: string, view: ViewType) {
    router.push(`/${quarter}/${view}`)
  }

  return <WelcomeView onNavigate={handleNavigate} />
}
