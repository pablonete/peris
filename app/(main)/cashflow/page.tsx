import type { Metadata } from "next"
import CashflowPageContent from "./content"

export const metadata: Metadata = {
  title: "Peris - Cashflow",
  description: "Monitor your quarterly cash flow and balances",
}

export default function CashflowPage() {
  return <CashflowPageContent />
}
