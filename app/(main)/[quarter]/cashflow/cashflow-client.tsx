"use client"

import { useRouter } from "next/navigation"
import { CashflowView } from "@/components/cashflow-view"

interface CashflowClientProps {
  quarterId: string
}

export function CashflowClient({ quarterId }: CashflowClientProps) {
  const router = useRouter()

  function handleNavigateToQuarter(qId: string) {
    router.push(`/${qId}/cashflow`)
  }

  return (
    <CashflowView
      quarterId={quarterId}
      onNavigateToQuarter={handleNavigateToQuarter}
    />
  )
}
