import { quarterIds } from "@/lib/sample-data"
import { CashflowClient } from "./cashflow-client"

interface CashflowPageProps {
  params: Promise<{ quarter: string }>
}

export async function generateStaticParams() {
  return quarterIds.map((quarter) => ({
    quarter,
  }))
}

export default async function CashflowPage({ params }: CashflowPageProps) {
  const { quarter } = await params

  return <CashflowClient quarterId={quarter} />
}
