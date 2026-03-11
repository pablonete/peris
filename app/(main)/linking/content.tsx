"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { LinkingView } from "@/components/linking-view"
import { useLanguage } from "@/lib/i18n-context"
import { Skeleton } from "@/components/ui/skeleton"

function LinkingContentInner() {
  const searchParams = useSearchParams()
  const quarter = searchParams.get("q") || ""
  const { t } = useLanguage()

  if (!quarter) {
    return (
      <p className="font-mono text-sm text-muted-foreground">
        {t("views.selectQuarter")}
      </p>
    )
  }

  return <LinkingView quarterId={quarter} />
}

export default function LinkingPageContent() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <LinkingContentInner />
    </Suspense>
  )
}
