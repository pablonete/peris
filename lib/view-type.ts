import { FileText, Receipt, ArrowRightLeft } from "lucide-react"

export type ViewType = "invoices" | "expenses" | "cashflow"

export const VIEW_TABS: {
  key: ViewType
  labelKey: string
  icon: typeof FileText
}[] = [
  { key: "invoices", labelKey: "sidebar.invoices", icon: FileText },
  { key: "expenses", labelKey: "sidebar.expenses", icon: Receipt },
  { key: "cashflow", labelKey: "sidebar.cashflow", icon: ArrowRightLeft },
]
