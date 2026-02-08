"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ExpensesView } from "@/components/expenses-view"
import { useLanguage } from "@/lib/i18n-context"

function ExpensesContent() {
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

  return <ExpensesView quarterId={quarter} />
}

export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesContent />
    </Suspense>
  )
}
