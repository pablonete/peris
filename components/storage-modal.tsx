"use client"

import { useState, useCallback } from "react"
import { useData } from "@/lib/use-data"
import { Storage } from "@/lib/storage-types"
import { validateStorageAccess } from "@/lib/github-data"
import { useLanguage } from "@/lib/i18n-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Loader2 } from "lucide-react"

interface StorageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StorageModal({ open, onOpenChange }: StorageModalProps) {
  const { t } = useLanguage()
  const { storages, addStorage, setActiveStorage } = useData()
  const [formData, setFormData] = useState({
    name: "",
    url: "",
  })
  const [saveToStorage, setSaveToStorage] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [testSuccess, setTestSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTestError(null)
    setTestSuccess(false)
  }

  const handleTestConnection = useCallback(async () => {
    if (!formData.url) {
      return
    }
    setTesting(true)
    setTestError(null)
    setTestSuccess(false)

    const storage: Storage = {
      name: formData.name || "Test",
      url: formData.url,
    }

    const result = await validateStorageAccess(storage)
    setTesting(false)

    if (result.valid) {
      setTestSuccess(true)
    } else {
      setTestError(result.error || t("storage.error.unknown"))
    }
  }, [formData, t])

  const handleUrlBlur = () => {
    if (!formData.url) {
      return
    }
    handleTestConnection()
  }

  const handleAddStorage = () => {
    if (!formData.name || !formData.url) {
      setTestError(t("storage.error.required"))
      return
    }

    if (storages.some((s) => s.name === formData.name)) {
      setTestError(t("storage.error.duplicateName"))
      return
    }

    if (!testSuccess) {
      setTestError(t("storage.error.notTested"))
      return
    }

    const newStorage: Storage = {
      name: formData.name,
      url: formData.url,
    }

    if (saveToStorage) {
      try {
        addStorage(newStorage)
        setActiveStorage(newStorage.name)
        setFormData({ name: "", url: "" })
        setSaveToStorage(true)
        setTestSuccess(false)
        setTestError(null)
        onOpenChange(false)
      } catch (error) {
        setTestError((error as Error).message)
      }
    } else {
      // If not saving, show the URL to user for manual use
      setTestError(t("storage.notSaved"))
      return
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("storage.addNew")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="storage-name" className="text-sm">
                {t("storage.name")}
              </Label>
              <Input
                id="storage-name"
                placeholder={t("storage.nameHelp")}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="storage-url" className="text-sm">
                {t("storage.repositoryUrl")}
              </Label>
              <div className="relative">
                <Input
                  id="storage-url"
                  placeholder={t("storage.repositoryUrlHelp")}
                  value={formData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                  onBlur={handleUrlBlur}
                  className="mt-1 pr-8 font-mono text-xs"
                />
                {testing ? (
                  <Loader2 className="absolute right-2 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                ) : testSuccess ? (
                  <Check className="absolute right-2 top-3 h-4 w-4 text-[hsl(var(--ledger-green))]" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("storage.repositoryUrlHint")}
              </p>
            </div>

            <div className="space-y-2 p-3 border border-amber-200 bg-amber-50 rounded-md">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="save-storage"
                  checked={saveToStorage}
                  onChange={(e) => setSaveToStorage(e.target.checked)}
                  className="mt-0.5"
                />
                <label htmlFor="save-storage" className="text-xs font-medium">
                  {t("storage.saveToLocalStorage")}
                </label>
              </div>
              <p className="text-xs text-amber-900 ml-5">
                {t("storage.saveWarning")}
              </p>
            </div>

            {testError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-sm text-red-900">
                  {testError}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleAddStorage}
              disabled={!testSuccess}
              size="sm"
              className="w-full"
            >
              {t("storage.add")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
