import { InvoicesView } from "@/components/invoices-view"
import { quarterIds } from "@/lib/sample-data"

interface InvoicesPageProps {
  params: Promise<{ quarter: string }>
}

export async function generateStaticParams() {
  return quarterIds.map((quarter) => ({
    quarter,
  }))
}

export default async function InvoicesPage({ params }: InvoicesPageProps) {
  const { quarter } = await params

  return <InvoicesView quarterId={quarter} />
}
