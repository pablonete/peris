"use client"

import { WelcomeView } from "@/components/welcome-view"
import { useRouter } from "next/navigation"
import type { ViewType } from "@/lib/view-type"

export default function WelcomePageContent() {
  const router = useRouter()

  function handleNavigate(quarter: string, view: ViewType) {
    router.push(`/${view}?q=${quarter}`)
  }

  return <WelcomeView onNavigate={handleNavigate} />
}
