"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n-context"
import { VIEW_TABS, ViewType } from "@/lib/view-type"

interface ViewTabsProps {
  quarterId: string
  selectedView: ViewType
  getEditingFile: (quarterId: string, view: ViewType) => unknown
  onTabClick?: () => void
}

export function ViewTabs({
  quarterId,
  selectedView,
  getEditingFile,
  onTabClick,
}: ViewTabsProps) {
  const { t } = useLanguage()

  return (
    <div className="flex shrink-0 border-b border-border bg-card px-2">
      {VIEW_TABS.map(({ key, labelKey, icon: Icon }) => {
        const isActive = selectedView === key
        const isEditing = !!getEditingFile(quarterId, key)
        return (
          <Link
            key={key}
            href={`/${key}?q=${quarterId}`}
            onClick={onTabClick}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
            {isEditing && (
              <span
                className="h-2 w-2 rounded-full bg-[hsl(var(--ledger-blue))]"
                aria-label={t("views.unsavedChanges")}
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}
