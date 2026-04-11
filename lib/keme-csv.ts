import { Expense, Invoice } from "@/lib/types"

const KEME_HEADERS = [
  "Asiento",
  "Fecha",
  "Cuenta",
  "Concepto",
  "Debe",
  "Haber",
  "Referencia",
]

type KemeCsvRow = [string, string, string, string, string, string, string]

const formatAmount = (value: number) => value.toFixed(2)

const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-")
  return [day, month, year].join("/")
}

const escapeCsvValue = (value: string) => {
  if (!/[",\n\r]/.test(value)) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}

const stringifyRows = (rows: KemeCsvRow[]) =>
  [KEME_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n")

const getInvoiceDescription = (invoice: Invoice) =>
  [invoice.client, invoice.concept].filter(Boolean).join(" · ")

const getExpenseDescription = (expense: Expense) =>
  [expense.vendor, expense.concept].filter(Boolean).join(" · ")

const getExpenseGrossAmount = (expense: Expense) =>
  expense.total + (expense.taxRetention ?? 0)

const getExpenseBaseAmount = (expense: Expense) => {
  const baseAmount =
    expense.vat?.reduce((sum, vatItem) => sum + vatItem.subtotal, 0) ?? 0

  if (baseAmount > 0) {
    return baseAmount
  }

  return getExpenseGrossAmount(expense)
}

const getExpenseVatAmount = (expense: Expense) =>
  expense.vat?.reduce((sum, vatItem) => sum + vatItem.amount, 0) ?? 0

export const buildKemeInvoiceCsv = (invoices: Invoice[]) => {
  const rows = invoices.flatMap<KemeCsvRow>((invoice, index) => {
    const asiento = String(index + 1)
    const date = formatDate(invoice.date)
    const description = getInvoiceDescription(invoice)
    const reference = invoice.number

    return [
      [
        asiento,
        date,
        "440.0",
        description,
        formatAmount(invoice.total),
        formatAmount(0),
        reference,
      ],
      [
        asiento,
        date,
        "700.0",
        description,
        formatAmount(0),
        formatAmount(invoice.subtotal),
        reference,
      ],
      [
        asiento,
        date,
        "477.0",
        description,
        formatAmount(0),
        formatAmount(invoice.vat),
        reference,
      ],
    ]
  })

  return stringifyRows(rows)
}

export const buildKemeExpenseCsv = (expenses: Expense[]) => {
  const rows = expenses.flatMap<KemeCsvRow>((expense, index) => {
    const asiento = String(index + 1)
    const date = formatDate(expense.date)
    const description = getExpenseDescription(expense)
    const reference = expense.number ?? ""
    const baseAmount = getExpenseBaseAmount(expense)
    const vatAmount = getExpenseVatAmount(expense)
    const payableAmount = baseAmount + vatAmount

    return [
      [
        asiento,
        date,
        "600.0",
        description,
        formatAmount(baseAmount),
        formatAmount(0),
        reference,
      ],
      [
        asiento,
        date,
        "472.0",
        description,
        formatAmount(vatAmount),
        formatAmount(0),
        reference,
      ],
      [
        asiento,
        date,
        "410.0",
        description,
        formatAmount(0),
        formatAmount(payableAmount),
        reference,
      ],
    ]
  })

  return stringifyRows(rows)
}
