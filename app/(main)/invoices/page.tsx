import type { Metadata } from "next"
import InvoicesPageContent from "./content"

export const metadata: Metadata = {
  title: "Peris - Invoices",
  description: "Manage and track your invoices",
}

export default function InvoicesPage() {
  return <InvoicesPageContent />
}
