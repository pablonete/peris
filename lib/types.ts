/**
 * Represents a VAT breakdown line item with rate and calculated amount.
 */
export interface VatItem {
  /** The amount before tax is applied */
  subtotal: number
  /** The VAT rate percentage (e.g., 21 for 21% VAT) */
  rate: number
  /** The calculated VAT amount based on subtotal and rate */
  amount: number
}

/**
 * Represents an invoice issued to a client.
 */
export interface Invoice {
  id: string
  /** Invoice issue date in ISO format (YYYY-MM-DD) */
  date: string
  /** Invoice number for reference and accounting (e.g., "2025-042") */
  number: string
  /** Client name or company */
  client: string
  /** Description of services/products provided */
  concept: string
  /** Amount before VAT */
  subtotal: number
  /** Single VAT amount (simplified for single-rate invoices) */
  vat: number
  /** Total amount including VAT */
  total: number
  /** Date when payment was received; undefined if pending */
  paymentDate?: string
}

/**
 * Represents an expense or bill received from a vendor.
 */
export interface Expense {
  id: string
  /** Expense date in ISO format (YYYY-MM-DD) */
  date: string
  /** Vendor's invoice/reference number if provided */
  number?: string
  /** Vendor name or company */
  vendor: string
  /** Description of the expense */
  concept: string
  /** VAT breakdown details */
  vat: VatItem[]
  /** Tax retention withheld by the company (IRPF, typically 15%) */
  taxRetention?: number
  /** Total amount including VAT and after tax retention */
  total: number
  /** Date when the expense was paid; undefined if pending */
  paymentDate?: string
}

/**
 * Represents a single transaction entry in the quarterly cashflow ledger.
 */
export interface CashflowEntry {
  id: string
  /** Transaction date in ISO format (YYYY-MM-DD) */
  date: string
  concept: string
  /** Reference to the related invoice or expense ID */
  reference?: string
  /** Income amount if this is an income transaction */
  income?: number
  /** Expense amount if this is an expense transaction */
  expense?: number
  /** Running account balance after this transaction */
  balance: number
}

/**
 * Represents all financial data for a quarter including invoices, expenses, and cashflow.
 */
export interface QuarterData {
  invoices: Invoice[]
  expenses: Expense[]
  cashflow: CashflowEntry[]
  /** Opening balance carried over from the previous quarter for the cashflow */
  carryOver: number
}
