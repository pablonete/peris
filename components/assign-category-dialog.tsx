"use client"

import { X } from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
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

interface AssignCategoryDialogProps {
  open: boolean
  onClose: () => void
  onAssign: (category: string | undefined) => void
  categories: string[]
  currentCategory?: string
}

export function AssignCategoryDialog({
  open,
  onClose,
  onAssign,
  categories,
  currentCategory,
}: AssignCategoryDialogProps) {
  const { t } = useLanguage()

  const handleSelect = (category: string) => {
    onAssign(category)
    onClose()
  }

  const handleClear = () => {
    onAssign(undefined)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t("cashflow.assignCategory")}</DialogTitle>
          <DialogDescription>
            {t("cashflow.assignCategoryDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ScrollArea className="h-[280px] rounded-md border">
            <div className="p-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleSelect(category)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-mono transition-colors hover:bg-accent ${
                    currentCategory === category
                      ? "bg-accent font-medium"
                      : "font-normal"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            {t("cashflow.clearCategory")}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t("cashflow.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
