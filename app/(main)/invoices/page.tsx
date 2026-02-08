"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { InvoicesView } from "@/components/invoices-view"
import { useLanguage } from "@/lib/i18n-context"

function InvoicesContent() {
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

  return <InvoicesView quarterId={quarter} />
}

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesContent />
    </Suspense>
  )
}
