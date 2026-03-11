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
  it("matches existing Unicaja entries, creates missing ones, and uses Nº mov as sequence", () => {
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

    const csvContent = [
      "Fecha de operación,Fecha valor,Concepto,Importe,Divisa,Saldo,Divisa,Nº mov,Oficina ,Categoría,Código Devolución,Concepto Devolución",
      "27/02/2026,27/02/2026,AUTONOMOS 000654 290102030405,-422.41,EUR,74.25,EUR,3006,8076,,,",
      "27/02/2026,27/02/2026,Ingreso,400.00,EUR,496.66,EUR,3005,8076,,,",
      "30/01/2026,30/01/2026,AUTONOMOS 000654 290102030405,-422.41,EUR,96.66,EUR,3004,3001,,,",
      "30/01/2026,30/01/2026,Ingreso TGSS,500.00,EUR,519.07,EUR,3003,8076,,,",
    ].join("\n")

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
        .filter(
          (entry) => entry.bankName === "Unicaja" || entry.bankName == null
        )
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
        concept: "Préstamo Admin tgss",
        bankSequence: 3003,
        balance: 1000,
        income: 500,
        expense: undefined,
      },
      {
        date: "2026-01-30",
        concept: "AUTONOMOS",
        bankSequence: 3004,
        balance: 577.59,
        income: undefined,
        expense: 422.41,
      },
      {
        date: "2026-02-27",
        concept: "Ingreso",
        bankSequence: 3005,
        balance: 977.59,
        income: 400,
        expense: undefined,
      },
      {
        date: "2026-02-27",
        concept: "AUTONOMOS 000654 290102030405",
        bankSequence: 3006,
        balance: 555.18,
        income: undefined,
        expense: 422.41,
      },
    ])

    expect(result.logPath).toBe(
      "import/unicaja-q1.peris-2026-03-07T16-10-31.772Z.log.txt"
    )
    expect(result.logContent).toContain("Creado")
    expect(result.logContent).toContain("Secuencia corregida: 2")
  })

  it("preserves carry-over balance and clears bankSequence when concept is in a different language", () => {
    const entries: CashflowEntry[] = [
      {
        id: "co",
        date: "2026-01-01",
        concept: "Saldo arrastrado",
        bankName: "Unicaja",
        balance: 19.07,
      },
    ]

    const csvContent = [
      "Fecha de operación,Fecha valor,Concepto,Importe,Divisa,Saldo,Divisa,Nº mov,Oficina ,Categoría,Código Devolución,Concepto Devolución",
      "27/02/2026,27/02/2026,AUTONOMOS 000384 291043657474,-422.41,EUR,74.25,EUR,3006,8076,,,",
      "27/02/2026,27/02/2026,Préstamo Admin,400.00,EUR,496.66,EUR,3005,8076,,,",
      "30/01/2026,30/01/2026,AUTONOMOS 000384 291043657474,-422.41,EUR,96.66,EUR,3004,3001,,,",
      "30/01/2026,30/01/2026,Préstamo Admin tgss,500.00,EUR,519.07,EUR,3003,8076,,,",
    ].join("\n")

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
      existing: 0,
      created: 4,
      ignored: 0,
      sequenceFixed: 0,
    })

    expect(
      result.entries
        .filter(
          (entry) => entry.bankName === "Unicaja" || entry.bankName == null
        )
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
        concept: "Saldo arrastrado",
        bankSequence: undefined,
        balance: 19.07,
        income: undefined,
        expense: undefined,
      },
      {
        date: "2026-01-30",
        concept: "Préstamo Admin tgss",
        bankSequence: 3003,
        balance: 519.07,
        income: 500,
        expense: undefined,
      },
      {
        date: "2026-01-30",
        concept: "AUTONOMOS 000384 291043657474",
        bankSequence: 3004,
        balance: 96.66,
        income: undefined,
        expense: 422.41,
      },
      {
        date: "2026-02-27",
        concept: "Préstamo Admin",
        bankSequence: 3005,
        balance: 496.66,
        income: 400,
        expense: undefined,
      },
      {
        date: "2026-02-27",
        concept: "AUTONOMOS 000384 291043657474",
        bankSequence: 3006,
        balance: 74.25,
        income: undefined,
        expense: 422.41,
      },
    ])
  })
})

function buildCsv(rows: Array<Record<string, string>>): string {
  return [
    revolutHeader.join(","),
    ...rows.map((row) => buildCsvRow(row, revolutHeader)),
  ].join("\n")
}

function buildCsvRow(row: Record<string, string>, header: string[]): string {
  return header.map((column) => escapeCsvValue(row[column] ?? "")).join(",")
}

function escapeCsvValue(value: string): string {
  if (!value.includes(",") && !value.includes('"') && !value.includes("\n")) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}
