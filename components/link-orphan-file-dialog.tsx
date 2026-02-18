"use client"

import { useState, useEffect } from "react"
import { Link2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import { useData } from "@/lib/use-data"
import { getOrphanFiles } from "@/lib/orphan-files"
import { Invoice, Expense } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LinkOrphanFileDialogProps {
  open: boolean
  onClose: () => void
  onLink: (filename: string) => void
  quarterId: string
  type: "invoices" | "expenses"
  linkedItems: Invoice[] | Expense[]
}

export function LinkOrphanFileDialog({
  open,
  onClose,
  onLink,
  quarterId,
  type,
  linkedItems,
}: LinkOrphanFileDialogProps) {
  const { t } = useLanguage()
  const { activeStorage } = useData()
  const [orphanFiles, setOrphanFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !activeStorage) {
      setOrphanFiles([])
      setSelectedFile(null)
      return
    }

    const loadOrphanFiles = async () => {
      setLoading(true)
      try {
        const files = await getOrphanFiles(
          activeStorage,
          quarterId,
          type,
          linkedItems
        )
        setOrphanFiles(files)
      } catch (error) {
        console.error("Failed to load orphan files:", error)
        setOrphanFiles([])
      } finally {
        setLoading(false)
      }
    }

    loadOrphanFiles()
  }, [open, activeStorage, quarterId, type, linkedItems])

  const handleLink = () => {
    if (selectedFile) {
      onLink(selectedFile)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {type === "invoices"
              ? t("invoices.linkOrphan")
              : t("expenses.linkOrphan")}
          </DialogTitle>
          <DialogDescription>
            {type === "invoices"
              ? t("invoices.linkOrphanDesc")
              : t("expenses.linkOrphanDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("expenses.loading")}
            </div>
          ) : orphanFiles.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {type === "invoices"
                ? t("invoices.noOrphanFiles")
                : t("expenses.noOrphanFiles")}
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-2">
                {orphanFiles.map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setSelectedFile(filename)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      selectedFile === filename
                        ? "bg-accent font-medium"
                        : "font-normal"
                    }`}
                  >
                    {filename}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("expenses.cancel")}
          </Button>
          <Button onClick={handleLink} disabled={!selectedFile}>
            <Link2 className="mr-2 h-4 w-4" />
            {type === "invoices"
              ? t("invoices.linkFile")
              : t("expenses.linkFile")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
