"use client"

import { useState } from "react"
import { useData } from "@/lib/data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import { StorageModal } from "./storage-modal"

export function StorageSelector() {
  const {
    storages,
    activeStorage,
    setActiveStorage,
    removeStorage,
    isSample,
    clearAllEditing,
  } = useData()
  const { t } = useLanguage()
  const [storageModalOpen, setStorageModalOpen] = useState(false)

  const handleValueChange = (value: string) => {
    if (value === "ADD_NEW") {
      setStorageModalOpen(true)
    } else {
      clearAllEditing()
      setActiveStorage(value)
    }
  }

  const handleDeleteStorage = () => {
    if (isSample) {
      return
    }

    if (
      confirm(
        `Are you sure you want to remove "${activeStorage.name}"? This cannot be undone.`
      )
    ) {
      removeStorage(activeStorage.name)
    }
  }

  return (
    <div className="w-full px-3 py-2 border-t border-sidebar-border">
      <label className="text-xs font-semibold text-sidebar-foreground/60 mb-2 block">
        {t("storage.title")}
      </label>
      <div className="flex gap-2">
        <Select value={activeStorage.name} onValueChange={handleValueChange}>
          <SelectTrigger className="h-9 text-sm flex-1 bg-sidebar-accent/30 border-sidebar-border hover:bg-sidebar-accent/50">
            <SelectValue placeholder="Select storage" />
          </SelectTrigger>
          <SelectContent className="bg-sidebar border-sidebar-border">
            {storages.map((storage) => (
              <SelectItem
                key={storage.name}
                value={storage.name}
                className="text-sidebar-foreground data-[highlighted]:bg-sidebar-accent/60 data-[highlighted]:text-sidebar-accent-foreground"
              >
                {storage.name}
              </SelectItem>
            ))}
            <SelectItem
              value="ADD_NEW"
              className="text-sidebar-foreground/60 italic data-[highlighted]:bg-sidebar-accent/60 data-[highlighted]:text-sidebar-accent-foreground"
            >
              {t("storage.connectNew")}
            </SelectItem>
          </SelectContent>
        </Select>
        {!isSample && (
          <Button
            onClick={handleDeleteStorage}
            variant="outline"
            size="icon"
            className="h-9 w-9 border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent/60"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <StorageModal
        open={storageModalOpen}
        onOpenChange={setStorageModalOpen}
      />
    </div>
  )
}
