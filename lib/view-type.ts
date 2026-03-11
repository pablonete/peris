import { FileText, Receipt, ArrowRightLeft, Link2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type ViewType = "invoices" | "expenses" | "cashflow" | "linking"

interface ViewTab {
  key: ViewType
  labelKey: string
  icon: LucideIcon
}

export const VIEW_TABS: ViewTab[] = [
  { key: "invoices", labelKey: "sidebar.invoices", icon: FileText },
  { key: "expenses", labelKey: "sidebar.expenses", icon: Receipt },
  { key: "cashflow", labelKey: "sidebar.cashflow", icon: ArrowRightLeft },
  { key: "linking", labelKey: "sidebar.linking", icon: Link2 },
]
