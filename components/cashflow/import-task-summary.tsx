"use client"

import { useLanguage } from "@/lib/i18n-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImportTaskResult } from "./use-cashflow-import-task"

interface ImportTaskSummaryProps {
  result: ImportTaskResult
}

export function ImportTaskSummary({ result }: ImportTaskSummaryProps) {
  const { t } = useLanguage()

  return (
    <Alert>
      <AlertDescription className="space-y-1 text-sm">
        <p>{t("cashflow.import.summaryReady")}</p>
        <p>
          {t("cashflow.import.otherQuarter")}: {result.summary.otherQuarter}
        </p>
        <p>
          {t("cashflow.import.existing")}: {result.summary.existing}
        </p>
        <p>
          {t("cashflow.import.created")}: {result.summary.created}
        </p>
        <p>
          {t("cashflow.import.ignored")}: {result.summary.ignored}
        </p>
        <p>
          {t("cashflow.import.sequenceFixed")}: {result.summary.sequenceFixed}
        </p>
        <p>
          {t("cashflow.import.logFile")}:{" "}
          <span className="font-mono text-xs">{result.logPath}</span>
        </p>
      </AlertDescription>
    </Alert>
  )
}
