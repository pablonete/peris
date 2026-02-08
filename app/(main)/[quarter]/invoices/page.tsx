import { InvoicesView } from "@/components/invoices-view"

interface InvoicesPageProps {
  params: Promise<{ quarter: string }>
}

export default async function InvoicesPage({ params }: InvoicesPageProps) {
  const { quarter } = await params

  return <InvoicesView quarterId={quarter} />
}
