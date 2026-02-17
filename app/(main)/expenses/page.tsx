import type { Metadata } from "next"
import ExpensesPageContent from "./content"

export const metadata: Metadata = {
  title: "Peris - Expenses",
  description: "Track and manage your business expenses",
}

export default function ExpensesPage() {
  return <ExpensesPageContent />
}
