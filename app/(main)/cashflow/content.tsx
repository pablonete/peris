"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CashflowView } from "@/components/cashflow-view"
import { useLanguage } from "@/lib/i18n-context"
import { Skeleton } from "@/components/ui/skeleton"

function CashflowContentInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const quarter = searchParams.get("q") || ""
  const { t } = useLanguage()

  if (!quarter) {
    return (
      <p className="font-mono text-sm text-muted-foreground">
        {t("views.selectQuarter")}
      </p>
    )
  }

  function handleNavigateToQuarter(qId: string) {
    router.push(`/cashflow?q=${qId}`)
  }

  return (
    <CashflowView
      quarterId={quarter}
      onNavigateToQuarter={handleNavigateToQuarter}
    />
  )
}

export default function CashflowPageContent() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CashflowContentInner />
    </Suspense>
  )
}
