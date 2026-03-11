import type { Metadata } from "next"
import LinkingPageContent from "./content"

export const metadata: Metadata = {
  title: "Peris - Linking",
  description: "View linked invoices, expenses, and cashflow entries",
}

export default function LinkingPage() {
  return <LinkingPageContent />
}
