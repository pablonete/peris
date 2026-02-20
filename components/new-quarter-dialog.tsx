"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useLanguage } from "@/lib/i18n-context"
import { useData } from "@/lib/use-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NewQuarterDialogProps {
  existingQuarters: string[]
}

function validateQuarterFormat(
  year: string,
  quarter: string,
  existingQuarters: string[],
  t: (key: string) => string
): string | null {
  if (!year || !quarter) {
    return null
  }

  const yearNum = parseInt(year, 10)
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return t("quarters.error.invalidYear")
  }

  const quarterMatch = quarter.match(/^[1-4]$/)
  if (!quarterMatch) {
    return t("quarters.error.invalidQuarter")
  }

  const quarterId = `${year}.${quarter}Q`
  if (existingQuarters.includes(quarterId)) {
    return `${t("quarters.error.duplicate")} (${quarterId})`
  }

  return null
}

export function NewQuarterDialog({ existingQuarters }: NewQuarterDialogProps) {
  const { t } = useLanguage()
  const { createNewQuarter } = useData()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState("")
  const [quarter, setQuarter] = useState("")

  const error = validateQuarterFormat(year, quarter, existingQuarters, t)
  const isValid = !error && year && quarter

  const handleCreate = () => {
    if (!isValid) return

    const quarterId = `${year}.${quarter}Q`

    createNewQuarter(quarterId)

    setYear("")
    setQuarter("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          aria-label={t("quarters.newQuarter")}
          title={t("quarters.newQuarter")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("quarters.newQuarter")}</DialogTitle>
          <DialogDescription>{t("quarters.newQuarterDesc")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="year">{t("quarters.year")}</Label>
              <Input
                id="year"
                placeholder="YYYY"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                type="number"
                min="2000"
                max="2100"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quarter">{t("quarters.quarter")}</Label>
              <Input
                id="quarter"
                placeholder="Q"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                type="number"
                min="1"
                max="4"
              />
            </div>
          </div>

          {year && quarter && (
            <p
              className={
                error
                  ? "text-sm text-red-600 dark:text-red-400"
                  : "text-sm text-muted-foreground"
              }
            >
              {error ? (
                error
              ) : (
                <>
                  {t("quarters.creatingFolder")}{" "}
                  <code className="font-mono">
                    {year}.{quarter}Q
                  </code>
                </>
              )}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("quarters.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={!isValid}>
            {t("quarters.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
