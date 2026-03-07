import { describe, expect, it } from "vitest"
import { parseCsvRecords } from "./csv-utils"

describe("parseCsvRecords", () => {
  it("parses simple csv rows into records", () => {
    expect(
      parseCsvRecords("name,amount\nRevolut,-51.90\nUnicaja,250.00")
    ).toEqual([
      { name: "Revolut", amount: "-51.90" },
      { name: "Unicaja", amount: "250.00" },
    ])
  })

  it("supports quoted fields with commas and escaped quotes", () => {
    expect(
      parseCsvRecords(
        'description,reference\n"Plan, Basic","He said ""hello"""'
      )
    ).toEqual([
      {
        description: "Plan, Basic",
        reference: 'He said "hello"',
      },
    ])
  })
})
