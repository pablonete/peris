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
  it("assigns short external IDs to newly created Revolut entries", () => {
    const entries: CashflowEntry[] = [
      {
        id: "co",
        date: "2026-01-01",
        concept: "Carry over",
        bankName: "Revolut",
        balance: 500,
      },
    ]

    const csvContent = buildCsv([
      {
        "Date started (UTC)": "2026-02-10",
        "Date completed (UTC)": "2026-02-10",
        ID: "6a2e7f47-31f8-ae0e-9947-20985d024b28",
        State: "COMPLETED",
        Description: "Cafetería Sol",
        Amount: "-5.00",
      },
      {
        "Date started (UTC)": "2026-02-11",
        "Date completed (UTC)": "2026-02-11",
        ID: "b3c1d2e4-9999-aaaa-bbbb-cccccccccccc",
        State: "COMPLETED",
        Description: "Mercadona",
        Amount: "-30.00",
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

    expect(result.summary.created).toBe(2)

    const revolutEntries = result.entries.filter(
      (e) => e.bankName === "Revolut" && e.id !== "co"
    )

    // First 8 chars of the UUID are used as the ID
    expect(revolutEntries[0].id).toBe("6a2e7f47")
    expect(revolutEntries[1].id).toBe("b3c1d2e4")
  })

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
  it("extends short Revolut IDs when their prefixes collide", () => {
    const entries: CashflowEntry[] = [
      {
        id: "co",
        date: "2031-03-31",
        concept: "Carry over",
        bankName: "Revolut",
        balance: 100,
      },
    ]
    const csvContent = buildCsv([
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "sharedidA-0000000001",
        State: "COMPLETED",
        Description: "Movement one",
        Amount: "-10.00",
      },
      {
        "Date started (UTC)": "2031-04-02",
        "Date completed (UTC)": "2031-04-02",
        ID: "sharedidB-0000000002",
        State: "COMPLETED",
        Description: "Movement two",
        Amount: "-20.00",
      },
    ])

    const firstImport = importCashflowFile({
      bank: "revolut",
      csvContent,
      fileName: "revolut-q2.csv",
      quarterId: "2031.2Q",
      entries,
    })
    const importedIds = firstImport.entries
      .filter((entry) => entry.bankName === "Revolut" && entry.id !== "co")
      .map((entry) => entry.id)

    expect(importedIds).toEqual(["sharedid", "sharedidB"])

    const secondImport = importCashflowFile({
      bank: "revolut",
      csvContent,
      fileName: "revolut-q2.csv",
      quarterId: "2031.2Q",
      entries: firstImport.entries,
    })
    expect(secondImport.summary.created).toBe(0)
    expect(secondImport.summary.existing).toBe(2)
  })

  it("orders same-day Revolut movements from balance chains, not CSV row order", () => {
    const entries: CashflowEntry[] = [
      {
        id: "co",
        date: "2031-03-31",
        concept: "Carry over",
        bankName: "Revolut",
        balance: 240.79,
      },
    ]
    const csvContent = buildCsv([
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "aaaaaaaa-0000-0000-0000-000000000001",
        State: "COMPLETED",
        Description: "Movement 1",
        Amount: "-80.00",
        Balance: "168.30",
      },
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "bbbbbbbb-0000-0000-0000-000000000002",
        State: "COMPLETED",
        Description: "Movement 2",
        Amount: "-9.00",
        Balance: "248.30",
      },
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "cccccccc-0000-0000-0000-000000000003",
        State: "COMPLETED",
        Description: "Movement 3",
        Amount: "-20.66",
        Balance: "257.30",
      },
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "dddddddd-0000-0000-0000-000000000004",
        State: "COMPLETED",
        Description: "Movement 4",
        Amount: "-47.83",
        Balance: "277.96",
      },
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "eeeeeeee-0000-0000-0000-000000000005",
        State: "COMPLETED",
        Description: "Movement 5",
        Amount: "85.00",
        Balance: "325.79",
      },
    ])

    const result = importCashflowFile({
      bank: "revolut",
      csvContent,
      fileName: "revolut-q2.csv",
      quarterId: "2031.2Q",
      entries,
      now: new Date("2031-07-12T10:00:00.000Z"),
    })

    expect(result.summary.created).toBe(5)
    expect(
      result.entries
        .filter((entry) => entry.bankName === "Revolut" && entry.id !== "co")
        .map(({ id, income, expense, balance, bankSequence }) => ({
          id,
          income,
          expense,
          balance,
          bankSequence,
        }))
    ).toEqual([
      {
        id: "eeeeeeee",
        income: 85,
        expense: undefined,
        balance: 325.79,
        bankSequence: 1,
      },
      {
        id: "dddddddd",
        income: undefined,
        expense: 47.83,
        balance: 277.96,
        bankSequence: 2,
      },
      {
        id: "cccccccc",
        income: undefined,
        expense: 20.66,
        balance: 257.3,
        bankSequence: 3,
      },
      {
        id: "bbbbbbbb",
        income: undefined,
        expense: 9,
        balance: 248.3,
        bankSequence: 4,
      },
      {
        id: "aaaaaaaa",
        income: undefined,
        expense: 80,
        balance: 168.3,
        bankSequence: 5,
      },
    ])
  })

  it("requires balance data to order same-day Revolut movements", () => {
    const csvContent = buildCsv([
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "aaaaaaaa-0000-0000-0000-000000000001",
        State: "COMPLETED",
        Description: "Movement 1",
        Amount: "-10.00",
      },
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "bbbbbbbb-0000-0000-0000-000000000002",
        State: "COMPLETED",
        Description: "Movement 2",
        Amount: "-20.00",
      },
    ])

    expect(() =>
      importCashflowFile({
        bank: "revolut",
        csvContent,
        fileName: "revolut-q2.csv",
        quarterId: "2031.2Q",
        entries: [
          {
            id: "co",
            date: "2031-03-31",
            concept: "Carry over",
            bankName: "Revolut",
            balance: 100,
          },
        ],
      })
    ).toThrow(/missing or invalid Balance values/)
  })

  it("uses the explicit opening balance even if the carry-over row is not first", () => {
    const entries: CashflowEntry[] = [
      {
        id: "existing",
        date: "2031-04-01",
        concept: "Existing movement",
        bankName: "Revolut",
        expense: 10,
        balance: 50,
        bankSequence: 1,
      },
      {
        id: "co",
        date: "2031-03-31",
        concept: "Carry over",
        bankName: "Revolut",
        balance: 100,
      },
    ]
    const csvContent = buildCsv([
      {
        "Date started (UTC)": "2031-04-01",
        "Date completed (UTC)": "2031-04-01",
        ID: "existing-row",
        State: "COMPLETED",
        Description: "Existing movement",
        Amount: "-10.00",
      },
      {
        "Date started (UTC)": "2031-04-02",
        "Date completed (UTC)": "2031-04-02",
        ID: "new-row-0001",
        State: "COMPLETED",
        Description: "New movement",
        Amount: "-5.00",
      },
    ])

    const result = importCashflowFile({
      bank: "revolut",
      csvContent,
      fileName: "revolut-q2.csv",
      quarterId: "2031.2Q",
      entries,
      now: new Date("2031-07-12T10:00:00.000Z"),
    })

    expect(
      result.entries
        .filter((entry) => entry.bankName === "Revolut")
        .map(({ id, balance }) => ({ id, balance }))
    ).toEqual([
      { id: "co", balance: 100 },
      { id: "existing", balance: 90 },
      { id: "new-row-", balance: 85 },
    ])
  })

  it("does not mistake a new similar movement for an existing one in the same CSV", () => {
    const entries: CashflowEntry[] = [
      {
        id: "co",
        date: "2031-04-01",
        concept: "Carry over",
        bankName: "Revolut",
        balance: 1000,
      },
    ]
    const csvContent = buildCsv([
      {
        "Date started (UTC)": "2031-04-10",
        "Date completed (UTC)": "2031-04-10",
        ID: "aaaaaaaa-0000-0000-0000-000000000001",
        State: "COMPLETED",
        Description: "Movement one",
        Amount: "-12.34",
      },
      {
        "Date started (UTC)": "2031-04-12",
        "Date completed (UTC)": "2031-04-12",
        ID: "bbbbbbbb-0000-0000-0000-000000000002",
        State: "COMPLETED",
        Description: "Movement two",
        Amount: "-12.34",
      },
    ])

    const firstImport = importCashflowFile({
      bank: "revolut",
      csvContent,
      fileName: "revolut-q2.csv",
      quarterId: "2031.2Q",
      entries,
      now: new Date("2031-07-12T10:00:00.000Z"),
    })

    expect(firstImport.summary.created).toBe(2)
    expect(firstImport.summary.existing).toBe(0)
    expect(
      firstImport.entries
        .filter((entry) => entry.bankName === "Revolut" && entry.id !== "co")
        .map(({ id, date, expense, balance, bankSequence }) => ({
          id,
          date,
          expense,
          balance,
          bankSequence,
        }))
    ).toEqual([
      {
        id: "aaaaaaaa",
        date: "2031-04-10",
        expense: 12.34,
        balance: 987.66,
        bankSequence: 1,
      },
      {
        id: "bbbbbbbb",
        date: "2031-04-12",
        expense: 12.34,
        balance: 975.32,
        bankSequence: 2,
      },
    ])

    const secondImport = importCashflowFile({
      bank: "revolut",
      csvContent,
      fileName: "revolut-q2.csv",
      quarterId: "2031.2Q",
      entries: firstImport.entries,
      now: new Date("2031-07-12T10:01:00.000Z"),
    })

    expect(secondImport.summary.created).toBe(0)
    expect(secondImport.summary.existing).toBe(2)
    expect(secondImport.entries).toEqual(firstImport.entries)
  })
