import { describe, expect, it } from "vitest"
import { CashflowEntry } from "@/lib/types"
import { importCashflowFile } from "@/model/cashflow/import"

const revolutHeader = [
  "Date started (UTC)",
  "Date completed (UTC)",
  "ID",
  "Type",
  "State",
  "Description",
  "Reference",
  "Payer",
  "Card number",
  "Card label",
  "Card state",
  "Orig currency",
  "Orig amount",
  "Payment currency",
  "Amount",
  "Total amount",
  "Exchange rate",
  "Fee",
  "Fee currency",
  "Balance",
  "Account",
  "Beneficiary account number",
  "Beneficiary sort code or routing number",
  "Beneficiary IBAN",
  "Beneficiary BIC",
  "MCC",
  "Related transaction id",
  "Spend program",
]

const unicajaHeader = [
  "Fecha de operación",
  "Fecha valor",
  "Concepto",
  "Importe",
  "Divisa",
  "Saldo",
  "Divisa",
  "Nº mov",
  "Oficina ",
  "Categoría",
  "Código Devolución",
  "Concepto Devolución",
]

describe("importCashflowFile", () => {
  it("matches existing Revolut entries, creates missing ones, and resequences the bank ledger", () => {
    const entries: CashflowEntry[] = [
      {
        id: "co",
        date: "2026-01-01",
        concept: "Carry over",
        bankName: "Revolut",
        balance: 1000,
      },
      {
        id: "cf-1",
        date: "2026-02-27",
        concept: "Mp**eess Los Patios Da",
        bankName: "Revolut",
        expense: 51.9,
        balance: 948.1,
        bankSequence: 2,
      },
      {
        id: "cf-2",
        date: "2026-02-25",
        concept: "Mp**eess Los Patios Da",
        bankName: "Revolut",
        expense: 63.85,
        balance: 884.25,
        bankSequence: 1,
      },
    ]

    const csvContent = buildCsv([
      {
        "Date started (UTC)": "2026-02-27",
        "Date completed (UTC)": "2026-02-28",
        ID: "row-1",
        State: "COMPLETED",
        Description: "Mp**eess Los Patios Da",
        Amount: "-51.90",
      },
      {
        "Date started (UTC)": "2026-02-25",
        "Date completed (UTC)": "2026-02-26",
        ID: "row-2",
        State: "COMPLETED",
        Description: "Mp**eess Los Patios Da",
        Amount: "-63.85",
      },
      {
        "Date started (UTC)": "2026-02-14",
        "Date completed (UTC)": "2026-02-14",
        ID: "row-3",
        State: "COMPLETED",
        Description: "Comisión de Revolut Business",
        Reference: "Tarifa del plan Basic",
        Amount: "-10.00",
      },
      {
        "Date started (UTC)": "2026-04-01",
        "Date completed (UTC)": "2026-04-01",
        ID: "row-4",
        State: "COMPLETED",
        Description: "Outside Quarter",
        Amount: "100.00",
      },
    ])

    const result = importCashflowFile({
      bank: "revolut",
      csvContent,
      fileName: "revolut-feb.csv",
      quarterId: "2026.1Q",
      entries,
      now: new Date("2026-03-07T16:10:31.772Z"),
    })

    expect(result.summary).toEqual({
      processed: 4,
      otherQuarter: 1,
      existing: 2,
      created: 1,
      ignored: 0,
      sequenceFixed: 2,
    })

    expect(
      result.entries
        .filter(
          (entry) => entry.bankName === "Revolut" || entry.bankName == null
        )
        .map(({ date, concept, bankSequence, balance, expense }) => ({
          date,
          concept,
          bankSequence,
          balance,
          expense,
        }))
    ).toEqual([
      {
        date: "2026-01-01",
        concept: "Carry over",
        bankSequence: undefined,
        balance: 1000,
        expense: undefined,
      },
      {
        date: "2026-02-14",
        concept: "Tarifa del plan Basic",
        bankSequence: 1,
        balance: 990,
        expense: 10,
      },
      {
        date: "2026-02-25",
        concept: "Mp**eess Los Patios Da",
        bankSequence: 2,
        balance: 926.15,
        expense: 63.85,
      },
      {
        date: "2026-02-27",
        concept: "Mp**eess Los Patios Da",
        bankSequence: 3,
        balance: 874.25,
        expense: 51.9,
      },
    ])

    expect(result.logPath).toBe(
      "import/revolut-feb.peris-2026-03-07T16-10-31.772Z.log.txt"
    )
    expect(result.logContent).toContain("Creado")
    expect(result.logContent).toContain("Otro trimestre")
    expect(result.logContent).toContain("Secuencia corregida: 2")
  })
  it("matches existing Unicaja entries, creates missing ones, and resequences the bank ledger", () => {
    const entries: CashflowEntry[] = [
      {
        id: "co",
        date: "2026-01-01",
        concept: "Carry over",
        bankName: "Unicaja",
        balance: 500,
      },
      {
        id: "cf-1",
        date: "2026-01-30",
        concept: "AUTONOMOS",
        bankName: "Unicaja",
        expense: 422.41,
        balance: 77.59,
        bankSequence: 2,
      },
      {
        id: "cf-2",
        date: "2026-01-30",
        concept: "Préstamo Admin tgss",
        bankName: "Unicaja",
        income: 500,
        balance: 577.59,
        bankSequence: 1,
      },
    ]

    const csvContent = buildUnicajaCsv([
      {
        "Fecha de operación": "27/02/2026",
        "Fecha valor": "27/02/2026",
        Concepto: "AUTONOMOS 000384 291043657474",
        Importe: "-422.41",
        "Nº mov": "3006",
      },
      {
        "Fecha de operación": "27/02/2026",
        "Fecha valor": "27/02/2026",
        Concepto: "Préstamo Admin",
        Importe: "400.00",
        "Nº mov": "3005",
      },
      {
        "Fecha de operación": "30/01/2026",
        "Fecha valor": "30/01/2026",
        Concepto: "AUTONOMOS 000384 291043657474",
        Importe: "-422.41",
        "Nº mov": "3004",
      },
      {
        "Fecha de operación": "30/01/2026",
        "Fecha valor": "30/01/2026",
        Concepto: "Préstamo Admin tgss",
        Importe: "500.00",
        "Nº mov": "3003",
      },
    ])

    const result = importCashflowFile({
      bank: "unicaja",
      csvContent,
      fileName: "unicaja-q1.csv",
      quarterId: "2026.1Q",
      entries,
      now: new Date("2026-03-07T16:10:31.772Z"),
    })

    expect(result.summary).toEqual({
      processed: 4,
      otherQuarter: 0,
      existing: 2,
      created: 2,
      ignored: 0,
      sequenceFixed: 2,
    })

    expect(
      result.entries
        .filter((entry) => entry.bankName === "Unicaja" || entry.bankName == null)
        .map(({ date, concept, bankSequence, balance, income, expense }) => ({
          date,
          concept,
          bankSequence,
          balance,
          income,
          expense,
        }))
    ).toEqual([
      {
        date: "2026-01-01",
        concept: "Carry over",
        bankSequence: undefined,
        balance: 500,
        income: undefined,
        expense: undefined,
      },
      {
        date: "2026-01-30",
        concept: "AUTONOMOS",
        bankSequence: 1,
        balance: 77.59,
        income: undefined,
        expense: 422.41,
      },
      {
        date: "2026-01-30",
        concept: "Préstamo Admin tgss",
        bankSequence: 2,
        balance: 577.59,
        income: 500,
        expense: undefined,
      },
      {
        date: "2026-02-27",
        concept: "AUTONOMOS 000384 291043657474",
        bankSequence: 3,
        balance: 155.18,
        income: undefined,
        expense: 422.41,
      },
      {
        date: "2026-02-27",
        concept: "Préstamo Admin",
        bankSequence: 4,
        balance: 555.18,
        income: 400,
        expense: undefined,
      },
    ])

    expect(result.logPath).toBe(
      "import/unicaja-q1.peris-2026-03-07T16-10-31.772Z.log.txt"
    )
    expect(result.logContent).toContain("Creado")
    expect(result.logContent).toContain("Secuencia corregida: 2")
  })
})

function buildCsv(rows: Array<Record<string, string>>): string {
  return [revolutHeader.join(","), ...rows.map((row) => buildCsvRow(row, revolutHeader))].join(
    "\n"
  )
}

function buildUnicajaCsv(rows: Array<Record<string, string>>): string {
  return [unicajaHeader.join(","), ...rows.map((row) => buildCsvRow(row, unicajaHeader))].join(
    "\n"
  )
}

function buildCsvRow(row: Record<string, string>, header: string[]): string {
  return header
    .map((column) => escapeCsvValue(row[column] ?? ""))
    .join(",")
}

function escapeCsvValue(value: string): string {
  if (!value.includes(",") && !value.includes('"') && !value.includes("\n")) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}
