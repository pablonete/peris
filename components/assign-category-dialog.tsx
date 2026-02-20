"use client"

import { useState } from "react"
import { Tag } from "lucide-react"
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
  const [selected, setSelected] = useState<string | undefined>(currentCategory)

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelected(currentCategory)
      onClose()
    }
  }

  const handleAssign = () => {
    onAssign(selected)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <button
                type="button"
                onClick={() => setSelected(undefined)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  selected === undefined ? "bg-accent font-medium" : "font-normal"
                }`}
              >
                <span className="text-muted-foreground italic">
                  {t("cashflow.noCategory")}
                </span>
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelected(category)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-mono transition-colors hover:bg-accent ${
                    selected === category ? "bg-accent font-medium" : "font-normal"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("cashflow.cancel")}
          </Button>
          <Button onClick={handleAssign}>
            <Tag className="mr-2 h-4 w-4" />
            {t("cashflow.assignCategory")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
