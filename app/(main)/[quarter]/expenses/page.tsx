import { ExpensesView } from "@/components/expenses-view"
import { quarterIds } from "@/lib/sample-data"

interface ExpensesPageProps {
  params: Promise<{ quarter: string }>
}

export async function generateStaticParams() {
  return quarterIds.map((quarter) => ({
    quarter,
  }))
}

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { quarter } = await params

  return <ExpensesView quarterId={quarter} />
}
