"use client"

import { Save, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import { useEditingState } from "@/lib/editing-state-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function CommitButton() {
  const { t } = useLanguage()
  const { editingCount, isCommitting, commitChanges } = useEditingState()

  if (editingCount === 0) {
    return null
  }

  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      <Button
        onClick={commitChanges}
        disabled={isCommitting}
        className="w-full bg-[hsl(var(--ledger-blue))] hover:bg-[hsl(var(--ledger-blue))]/90 text-white"
        size="sm"
      >
        {isCommitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {t("sidebar.commitChanges")}
            <Badge variant="secondary" className="ml-2">
              {editingCount}
            </Badge>
          </>
        )}
      </Button>
    </div>
  )
}
