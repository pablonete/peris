import { describe, expect, it } from "vitest"
import { buildKemeExpenseCsv, buildKemeInvoiceCsv } from "./keme-csv"

describe("buildKemeInvoiceCsv", () => {
  it("creates one balanced asiento per invoice with Keme accounts", () => {
    expect(
      buildKemeInvoiceCsv([
        {
          id: "inv-1",
          date: "2025-01-15",
          number: "2025-001",
          client: "Acme Corp",
          concept: "Development services",
          subtotal: 1000,
          vat: 210,
          total: 1210,
        },
      ])
    ).toBe(
      [
        "Asiento,Fecha,Cuenta,Concepto,Debe,Haber,Referencia",
        "1,15/01/2025,440.0,Acme Corp · Development services,1210.00,0.00,2025-001",
        "1,15/01/2025,700.0,Acme Corp · Development services,0.00,1000.00,2025-001",
        "1,15/01/2025,477.0,Acme Corp · Development services,0.00,210.00,2025-001",
      ].join("\n")
    )
  })

  it("escapes CSV fields when concepts include commas or quotes", () => {
    expect(
      buildKemeInvoiceCsv([
        {
          id: "inv-1",
          date: "2025-01-15",
          number: 'SER-"1"',
          client: "Acme, Corp",
          concept: 'Phase "A"',
          subtotal: 100,
          vat: 21,
          total: 121,
        },
      ])
    ).toContain('"Acme, Corp · Phase ""A"""')
  })
})

describe("buildKemeExpenseCsv", () => {
  it("creates one balanced asiento per expense with Keme accounts", () => {
    expect(
      buildKemeExpenseCsv([
        {
          id: "exp-1",
          date: "2025-02-10",
          number: "R-42",
          vendor: "Provider SL",
          concept: "Hosting",
          vat: [{ subtotal: 100, rate: 21, amount: 21 }],
          total: 121,
        },
      ])
    ).toBe(
      [
        "Asiento,Fecha,Cuenta,Concepto,Debe,Haber,Referencia",
        "1,10/02/2025,600.0,Provider SL · Hosting,100.00,0.00,R-42",
        "1,10/02/2025,472.0,Provider SL · Hosting,21.00,0.00,R-42",
        "1,10/02/2025,410.0,Provider SL · Hosting,0.00,121.00,R-42",
      ].join("\n")
    )
  })

  it("uses the gross supplier amount when the expense has IRPF retention", () => {
    expect(
      buildKemeExpenseCsv([
        {
          id: "exp-1",
          date: "2025-02-10",
          vendor: "Provider SL",
          concept: "Professional services",
          vat: [{ subtotal: 100, rate: 21, amount: 21 }],
          taxRetention: 15,
          total: 106,
        },
      ])
    ).toContain(
      "1,10/02/2025,410.0,Provider SL · Professional services,0.00,121.00,"
    )
  })
})
