import { describe, expect, it } from "vitest"
import { importCashflowFile } from "@/lib/cashflow-import"
import { CashflowEntry } from "@/lib/types"

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
})

function buildCsv(rows: Array<Record<string, string>>): string {
  return [revolutHeader.join(","), ...rows.map((row) => buildCsvRow(row))].join(
    "\n"
  )
}

function buildCsvRow(row: Record<string, string>): string {
  return revolutHeader
    .map((column) => escapeCsvValue(row[column] ?? ""))
    .join(",")
}

function escapeCsvValue(value: string): string {
  if (!value.includes(",") && !value.includes('"') && !value.includes("\n")) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}
