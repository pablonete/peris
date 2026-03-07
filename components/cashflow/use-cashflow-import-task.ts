"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  importCashflowFile,
  CashflowImportSummary,
} from "@/lib/cashflow-import"
import {
  CashflowImportBank,
  getCashflowImportDefinition,
} from "@/lib/cashflow-import-definitions"
import { useData } from "@/lib/use-data"
import { useFileSha } from "@/lib/use-storage-data"
import { CashflowEntry } from "@/lib/types"
import { useLanguage } from "@/lib/i18n-context"

const IMPORT_FOLDER = "import"

export interface ImportTaskResult {
  summary: CashflowImportSummary
  logPath: string
}

export function useCashflowImportTask({
  open,
  quarterId,
  entries,
  selectedBank,
  selectedFile,
}: {
  open: boolean
  quarterId: string
  entries: CashflowEntry[]
  selectedBank: CashflowImportBank
  selectedFile: string
}) {
  const { t } = useLanguage()
  const {
    activeStorage,
    getEditingFile,
    setEditingFile,
    setEditingTextFile,
    listFiles,
    readTextFile,
  } = useData()
  const fileSha = useFileSha(quarterId, "cashflow")
  const definition = getCashflowImportDefinition(selectedBank)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportTaskResult | null>(null)

  const importFilesQuery = useQuery({
    queryKey: ["importFiles", activeStorage?.name, selectedBank],
    queryFn: async () => {
      const files = await listFiles(IMPORT_FOLDER)
      return files
        .filter((file) => file.toLowerCase().endsWith(definition.fileExtension))
        .sort((left, right) => left.localeCompare(right))
    },
    enabled: open && !!activeStorage,
  })

  const runImport = async () => {
    if (!selectedFile) {
      return
    }

    setImporting(true)
    setError(null)
    setResult(null)

    const fileResult = await readTextFile(`${IMPORT_FOLDER}/${selectedFile}`)
    if (fileResult.data == null) {
      setImporting(false)
      setError(fileResult.error || t("cashflow.import.loadError"))
      return
    }

    try {
      const editingFile = getEditingFile(quarterId, "cashflow")
      const importResult = importCashflowFile({
        bank: selectedBank,
        csvContent: fileResult.data,
        fileName: selectedFile,
        quarterId,
        entries,
      })

      setEditingFile(
        quarterId,
        "cashflow",
        importResult.entries,
        editingFile?.sha ?? fileSha
      )
      setEditingTextFile(
        importResult.logPath,
        importResult.logContent,
        undefined,
        "text"
      )
      setResult({
        summary: importResult.summary,
        logPath: importResult.logPath,
      })
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : t("cashflow.import.loadError")
      )
    } finally {
      setImporting(false)
    }
  }

  const resetTask = () => {
    setImporting(false)
    setError(null)
    setResult(null)
  }

  return {
    files: importFilesQuery.data ?? [],
    filesPending: importFilesQuery.isPending,
    importing,
    error,
    result,
    runImport,
    resetTask,
  }
}
