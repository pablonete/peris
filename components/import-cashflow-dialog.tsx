"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import {
  importCashflowFile,
  CashflowImportSummary,
} from "@/lib/cashflow-import"
import {
  cashflowImportDefinitions,
  CashflowImportBank,
  getCashflowImportDefinition,
} from "@/lib/cashflow-import-definitions"
import { listRootFolderFiles, loadRootTextFile } from "@/lib/github-data"
import { useData } from "@/lib/use-data"
import { useFileSha } from "@/lib/use-storage-data"
import { CashflowEntry } from "@/lib/types"
import { useLanguage } from "@/lib/i18n-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportCashflowDialogProps {
  quarterId: string
  entries: CashflowEntry[]
}

interface ImportTaskResult {
  summary: CashflowImportSummary
  logPath: string
}

const IMPORT_FOLDER = "import"

export function ImportCashflowDialog({
  quarterId,
  entries,
}: ImportCashflowDialogProps) {
  const { t } = useLanguage()
  const {
    activeStorage,
    getEditingFile,
    setEditingFile,
    setEditingRootTextFile,
  } = useData()
  const fileSha = useFileSha(quarterId, "cashflow")
  const [open, setOpen] = useState(false)
  const [selectedBank, setSelectedBank] =
    useState<CashflowImportBank>("revolut")
  const [selectedFile, setSelectedFile] = useState("")
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportTaskResult | null>(null)
  const definition = getCashflowImportDefinition(selectedBank)

  const importFilesQuery = useQuery({
    queryKey: ["importFiles", activeStorage?.name, selectedBank],
    queryFn: async () => {
      const files = await listRootFolderFiles(activeStorage!, IMPORT_FOLDER)
      return files
        .filter((file) => file.toLowerCase().endsWith(definition.fileExtension))
        .sort((left, right) => left.localeCompare(right))
    },
    enabled: open && !!activeStorage,
  })

  useEffect(() => {
    const files = importFilesQuery.data ?? []
    if (!files.includes(selectedFile)) {
      setSelectedFile(files[0] ?? "")
    }
  }, [importFilesQuery.data, selectedFile])

  useEffect(() => {
    if (!open) {
      setError(null)
      setResult(null)
      setImporting(false)
    }
  }, [open])

  const handleImport = async () => {
    if (!activeStorage || !selectedFile) {
      return
    }

    setImporting(true)
    setError(null)
    setResult(null)

    const fileResult = await loadRootTextFile(
      activeStorage,
      `${IMPORT_FOLDER}/${selectedFile}`
    )

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
      setEditingRootTextFile(importResult.logPath, importResult.logContent)
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

  const files = importFilesQuery.data ?? []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("cashflow.import.action")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("cashflow.import.title")}</DialogTitle>
          <DialogDescription>
            {t("cashflow.import.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cashflow-import-bank">
              {t("cashflow.import.bankLabel")}
            </Label>
            <Select
              value={selectedBank}
              onValueChange={(value) =>
                setSelectedBank(value as CashflowImportBank)
              }
            >
              <SelectTrigger id="cashflow-import-bank">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cashflowImportDefinitions.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashflow-import-file">
              {t("cashflow.import.fileLabel")}
            </Label>
            <Select
              value={selectedFile}
              onValueChange={setSelectedFile}
              disabled={importFilesQuery.isPending || files.length === 0}
            >
              <SelectTrigger id="cashflow-import-file">
                <SelectValue
                  placeholder={
                    importFilesQuery.isPending
                      ? t("cashflow.import.loadingFiles")
                      : t("cashflow.import.selectFile")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {files.map((file) => (
                  <SelectItem key={file} value={file}>
                    {file}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {files.length === 0 && !importFilesQuery.isPending && (
              <p className="text-sm text-muted-foreground">
                {t("cashflow.import.noFiles")}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription className="space-y-1 text-sm">
                <p>{t("cashflow.import.summaryReady")}</p>
                <p>
                  {t("cashflow.import.otherQuarter")}:{" "}
                  {result.summary.otherQuarter}
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
                  {t("cashflow.import.sequenceFixed")}:{" "}
                  {result.summary.sequenceFixed}
                </p>
                <p>
                  {t("cashflow.import.logFile")}:{" "}
                  <span className="font-mono text-xs">{result.logPath}</span>
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cashflow.cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !selectedFile || importFilesQuery.isPending}
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("cashflow.import.running")}
              </>
            ) : (
              t("cashflow.import.action")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
