"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  cashflowImportDefinitions,
  CashflowImportBank,
} from "@/model/cashflow/import-definitions"
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
import { ImportTaskSummary } from "./import-task-summary"
import { useCashflowImportTask } from "./use-cashflow-import-task"

interface ImportCashflowDialogProps {
  quarterId: string
  entries: CashflowEntry[]
}

export function ImportCashflowDialog({
  quarterId,
  entries,
}: ImportCashflowDialogProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [selectedBank, setSelectedBank] =
    useState<CashflowImportBank>("revolut")
  const [selectedFile, setSelectedFile] = useState("")
  const {
    files,
    filesPending,
    importing,
    error,
    result,
    runImport,
    resetTask,
  } = useCashflowImportTask({
    open,
    quarterId,
    entries,
    selectedBank,
    selectedFile,
  })

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSelectedFile("")
      resetTask()
    }
  }

  const handleBankChange = (value: string) => {
    setSelectedBank(value as CashflowImportBank)
    setSelectedFile("")
    resetTask()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Select value={selectedBank} onValueChange={handleBankChange}>
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
              disabled={filesPending || files.length === 0}
            >
              <SelectTrigger id="cashflow-import-file">
                <SelectValue
                  placeholder={
                    filesPending
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
            {files.length === 0 && !filesPending && (
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

          {result && <ImportTaskSummary result={result} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {result ? t("cashflow.import.close") : t("cashflow.cancel")}
          </Button>
          {!result && (
            <Button
              onClick={runImport}
              disabled={importing || !selectedFile || filesPending}
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
