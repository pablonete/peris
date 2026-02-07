// ── Types ──────────────────────────────────────────────────

export interface Invoice {
  id: string
  date: string
  number: string
  client: string
  concept: string
  subtotal: number
  vat: number
  total: number
  paymentDate: string | null
}

export interface Expense {
  id: string
  date: string
  number: string | null
  vendor: string
  concept: string
  subtotal: number
  vat: number
  total: number
  deductible: boolean
}

export interface CashflowEntry {
  id: string
  date: string
  concept: string
  reference: string | null
  income: number | null
  expense: number | null
  balance: number
}

export interface QuarterData {
  invoices: Invoice[]
  expenses: Expense[]
  cashflow: CashflowEntry[]
  carryOver: number
}

// ── Sample Data ────────────────────────────────────────────

export const quarters: Record<string, QuarterData> = {
  "2025.4Q": {
    carryOver: 12450.3,
    invoices: [
      {
        id: "inv-001",
        date: "2025-10-05",
        number: "2025-042",
        client: "Acme Solutions S.L.",
        concept: "Web development - October",
        subtotal: 3200.0,
        vat: 672.0,
        total: 3872.0,
        paymentDate: "2025-10-20",
      },
      {
        id: "inv-002",
        date: "2025-10-18",
        number: "2025-043",
        client: "Nordica Digital GmbH",
        concept: "UX consulting (40h)",
        subtotal: 2800.0,
        vat: 0,
        total: 2800.0,
        paymentDate: "2025-10-30",
      },
      {
        id: "inv-003",
        date: "2025-11-02",
        number: "2025-044",
        client: "Acme Solutions S.L.",
        concept: "Web development - November",
        subtotal: 3200.0,
        vat: 672.0,
        total: 3872.0,
        paymentDate: "2025-11-18",
      },
      {
        id: "inv-004",
        date: "2025-11-20",
        number: "2025-045",
        client: "La Bodega Digital S.L.",
        concept: "E-commerce setup",
        subtotal: 4500.0,
        vat: 945.0,
        total: 5445.0,
        paymentDate: null,
      },
      {
        id: "inv-005",
        date: "2025-12-01",
        number: "2025-046",
        client: "Acme Solutions S.L.",
        concept: "Web development - December",
        subtotal: 3200.0,
        vat: 672.0,
        total: 3872.0,
        paymentDate: "2025-12-12",
      },
      {
        id: "inv-006",
        date: "2025-12-15",
        number: "2025-047",
        client: "Sunrise Ventures Ltd.",
        concept: "Mobile app prototype",
        subtotal: 5800.0,
        vat: 1218.0,
        total: 7018.0,
        paymentDate: null,
      },
    ],
    expenses: [
      {
        id: "exp-001",
        date: "2025-10-01",
        number: "A-8841",
        vendor: "Hetzner Online GmbH",
        concept: "Cloud server hosting (Oct-Dec)",
        subtotal: 89.7,
        vat: 18.84,
        total: 108.54,
        deductible: true,
      },
      {
        id: "exp-002",
        date: "2025-10-05",
        number: null,
        vendor: "GitHub Inc.",
        concept: "Team plan subscription",
        subtotal: 19.0,
        vat: 0,
        total: 19.0,
        deductible: true,
      },
      {
        id: "exp-003",
        date: "2025-10-15",
        number: "F-2025-1190",
        vendor: "WeWork Spain S.L.",
        concept: "Coworking space - October",
        subtotal: 250.0,
        vat: 52.5,
        total: 302.5,
        deductible: true,
      },
      {
        id: "exp-004",
        date: "2025-11-03",
        number: null,
        vendor: "Seguridad Social",
        concept: "Self-employment contribution Q4",
        subtotal: 960.0,
        vat: 0,
        total: 960.0,
        deductible: false,
      },
      {
        id: "exp-005",
        date: "2025-11-15",
        number: "F-2025-1245",
        vendor: "WeWork Spain S.L.",
        concept: "Coworking space - November",
        subtotal: 250.0,
        vat: 52.5,
        total: 302.5,
        deductible: true,
      },
      {
        id: "exp-006",
        date: "2025-12-01",
        number: "INV-44821",
        vendor: "Figma Inc.",
        concept: "Professional plan (annual)",
        subtotal: 144.0,
        vat: 0,
        total: 144.0,
        deductible: true,
      },
      {
        id: "exp-007",
        date: "2025-12-10",
        number: null,
        vendor: "Agencia Tributaria",
        concept: "VAT payment Q3 (modelo 303)",
        subtotal: 1842.0,
        vat: 0,
        total: 1842.0,
        deductible: false,
      },
      {
        id: "exp-008",
        date: "2025-12-15",
        number: "F-2025-1301",
        vendor: "WeWork Spain S.L.",
        concept: "Coworking space - December",
        subtotal: 250.0,
        vat: 52.5,
        total: 302.5,
        deductible: true,
      },
    ],
    cashflow: [
      {
        id: "cf-001",
        date: "2025-10-01",
        concept: "Carry over",
        reference: null,
        income: null,
        expense: null,
        balance: 12450.3,
      },
      {
        id: "cf-002",
        date: "2025-10-05",
        concept: "GitHub subscription",
        reference: "exp-002",
        income: null,
        expense: 19.0,
        balance: 12431.3,
      },
      {
        id: "cf-003",
        date: "2025-10-08",
        concept: "Hetzner hosting",
        reference: "exp-001",
        income: null,
        expense: 108.54,
        balance: 12322.76,
      },
      {
        id: "cf-004",
        date: "2025-10-12",
        concept: "Acme Solutions - inv 042",
        reference: "inv-001",
        income: 3872.0,
        expense: null,
        balance: 16194.76,
      },
      {
        id: "cf-005",
        date: "2025-10-15",
        concept: "WeWork coworking Oct",
        reference: "exp-003",
        income: null,
        expense: 302.5,
        balance: 15892.26,
      },
      {
        id: "cf-006",
        date: "2025-10-25",
        concept: "Nordica Digital - inv 043",
        reference: "inv-002",
        income: 2800.0,
        expense: null,
        balance: 18692.26,
      },
      {
        id: "cf-007",
        date: "2025-11-03",
        concept: "Seguridad Social Q4",
        reference: "exp-004",
        income: null,
        expense: 960.0,
        balance: 17732.26,
      },
      {
        id: "cf-008",
        date: "2025-11-10",
        concept: "Acme Solutions - inv 044",
        reference: "inv-003",
        income: 3872.0,
        expense: null,
        balance: 21604.26,
      },
      {
        id: "cf-009",
        date: "2025-11-15",
        concept: "WeWork coworking Nov",
        reference: "exp-005",
        income: null,
        expense: 302.5,
        balance: 21301.76,
      },
      {
        id: "cf-010",
        date: "2025-12-01",
        concept: "Figma annual plan",
        reference: "exp-006",
        income: null,
        expense: 144.0,
        balance: 21157.76,
      },
      {
        id: "cf-011",
        date: "2025-12-05",
        concept: "Acme Solutions - inv 046",
        reference: "inv-005",
        income: 3872.0,
        expense: null,
        balance: 25029.76,
      },
      {
        id: "cf-012",
        date: "2025-12-10",
        concept: "VAT payment Q3",
        reference: "exp-007",
        income: null,
        expense: 1842.0,
        balance: 23187.76,
      },
      {
        id: "cf-013",
        date: "2025-12-15",
        concept: "WeWork coworking Dec",
        reference: "exp-008",
        income: null,
        expense: 302.5,
        balance: 22885.26,
      },
    ],
  },
  "2026.1Q": {
    carryOver: 22885.26,
    invoices: [
      {
        id: "inv-101",
        date: "2026-01-05",
        number: "2026-001",
        client: "Acme Solutions S.L.",
        concept: "Web development - January",
        subtotal: 3200.0,
        vat: 672.0,
        total: 3872.0,
        paymentDate: "2026-01-20",
      },
      {
        id: "inv-102",
        date: "2026-01-20",
        number: "2026-002",
        client: "La Bodega Digital S.L.",
        concept: "E-commerce maintenance (Jan)",
        subtotal: 1200.0,
        vat: 252.0,
        total: 1452.0,
        paymentDate: "2026-02-02",
      },
      {
        id: "inv-103",
        date: "2026-02-03",
        number: "2026-003",
        client: "Acme Solutions S.L.",
        concept: "Web development - February",
        subtotal: 3200.0,
        vat: 672.0,
        total: 3872.0,
        paymentDate: "2026-02-28",
      },
      {
        id: "inv-104",
        date: "2026-02-18",
        number: "2026-004",
        client: "Sunrise Ventures Ltd.",
        concept: "Mobile app phase 2",
        subtotal: 6200.0,
        vat: 1302.0,
        total: 7502.0,
        paymentDate: null,
      },
      {
        id: "inv-105",
        date: "2026-03-02",
        number: "2026-005",
        client: "Acme Solutions S.L.",
        concept: "Web development - March",
        subtotal: 3200.0,
        vat: 672.0,
        total: 3872.0,
        paymentDate: null,
      },
    ],
    expenses: [
      {
        id: "exp-101",
        date: "2026-01-01",
        number: "A-9102",
        vendor: "Hetzner Online GmbH",
        concept: "Cloud server hosting (Jan-Mar)",
        subtotal: 89.7,
        vat: 18.84,
        total: 108.54,
        deductible: true,
      },
      {
        id: "exp-102",
        date: "2026-01-05",
        number: null,
        vendor: "GitHub Inc.",
        concept: "Team plan subscription",
        subtotal: 19.0,
        vat: 0,
        total: 19.0,
        deductible: true,
      },
      {
        id: "exp-103",
        date: "2026-01-15",
        number: "F-2026-0051",
        vendor: "WeWork Spain S.L.",
        concept: "Coworking space - January",
        subtotal: 250.0,
        vat: 52.5,
        total: 302.5,
        deductible: true,
      },
      {
        id: "exp-104",
        date: "2026-02-03",
        number: null,
        vendor: "Seguridad Social",
        concept: "Self-employment contribution Q1",
        subtotal: 960.0,
        vat: 0,
        total: 960.0,
        deductible: false,
      },
      {
        id: "exp-105",
        date: "2026-02-15",
        number: "F-2026-0112",
        vendor: "WeWork Spain S.L.",
        concept: "Coworking space - February",
        subtotal: 250.0,
        vat: 52.5,
        total: 302.5,
        deductible: true,
      },
      {
        id: "exp-106",
        date: "2026-03-15",
        number: "F-2026-0188",
        vendor: "WeWork Spain S.L.",
        concept: "Coworking space - March",
        subtotal: 250.0,
        vat: 52.5,
        total: 302.5,
        deductible: true,
      },
    ],
    cashflow: [
      {
        id: "cf-101",
        date: "2026-01-01",
        concept: "Carry over",
        reference: null,
        income: null,
        expense: null,
        balance: 22885.26,
      },
      {
        id: "cf-102",
        date: "2026-01-05",
        concept: "GitHub subscription",
        reference: "exp-102",
        income: null,
        expense: 19.0,
        balance: 22866.26,
      },
      {
        id: "cf-103",
        date: "2026-01-08",
        concept: "Hetzner hosting",
        reference: "exp-101",
        income: null,
        expense: 108.54,
        balance: 22757.72,
      },
      {
        id: "cf-104",
        date: "2026-01-12",
        concept: "Acme Solutions - inv 001",
        reference: "inv-101",
        income: 3872.0,
        expense: null,
        balance: 26629.72,
      },
      {
        id: "cf-105",
        date: "2026-01-15",
        concept: "WeWork coworking Jan",
        reference: "exp-103",
        income: null,
        expense: 302.5,
        balance: 26327.22,
      },
      {
        id: "cf-106",
        date: "2026-01-28",
        concept: "La Bodega Digital - inv 002",
        reference: "inv-102",
        income: 1452.0,
        expense: null,
        balance: 27779.22,
      },
      {
        id: "cf-107",
        date: "2026-02-03",
        concept: "Seguridad Social Q1",
        reference: "exp-104",
        income: null,
        expense: 960.0,
        balance: 26819.22,
      },
      {
        id: "cf-108",
        date: "2026-02-10",
        concept: "Acme Solutions - inv 003",
        reference: "inv-103",
        income: 3872.0,
        expense: null,
        balance: 30691.22,
      },
      {
        id: "cf-109",
        date: "2026-02-15",
        concept: "WeWork coworking Feb",
        reference: "exp-105",
        income: null,
        expense: 302.5,
        balance: 30388.72,
      },
      {
        id: "cf-110",
        date: "2026-03-15",
        concept: "WeWork coworking Mar",
        reference: "exp-106",
        income: null,
        expense: 302.5,
        balance: 30086.22,
      },
    ],
  },
}

export const quarterIds = Object.keys(quarters)

// ── Helpers ────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function getQuarterSummary(qId: string) {
  const q = quarters[qId]
  if (!q) return null

  const totalInvoiced = q.invoices.reduce((s, i) => s + i.total, 0)
  const totalExpenses = q.expenses.reduce((s, e) => s + e.total, 0)
  const closingBalance =
    q.cashflow[q.cashflow.length - 1]?.balance ?? q.carryOver

  return {
    totalInvoiced,
    totalExpenses,
    carryOver: q.carryOver,
    closingBalance,
    net: totalInvoiced - totalExpenses,
  }
}
