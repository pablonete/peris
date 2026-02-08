import { ExpensesView } from "@/components/expenses-view"

interface ExpensesPageProps {
  params: Promise<{ quarter: string }>
}

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { quarter } = await params

  return <ExpensesView quarterId={quarter} />
}
