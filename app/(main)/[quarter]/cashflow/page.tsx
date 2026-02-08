import { CashflowClient } from "./cashflow-client"

interface CashflowPageProps {
  params: Promise<{ quarter: string }>
}

export default async function CashflowPage({ params }: CashflowPageProps) {
  const { quarter } = await params

  return <CashflowClient quarterId={quarter} />
}
