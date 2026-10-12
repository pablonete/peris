import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { generateCashflowForQuarter } from "./generate"

const temporaryDirectories: string[] = []

async function createDataRepo(entries: unknown[]): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "peris-cashflow-test-"))
  temporaryDirectories.push(root)
  await mkdir(path.join(root, "import"), { recursive: true })
  await mkdir(path.join(root, "2031.2Q"), { recursive: true })
  await writeFile(
    path.join(root, "2031.2Q", "cashflow.json"),
    `${JSON.stringify(entries, null, 2)}\n`
  )
  return root
}

const unicajaCsv = [
  "Fecha de operación,Fecha valor,Concepto,Importe,Nº mov",
  "02/04/2031,02/04/2031,Purchase,-10.00,1001",
].join("\n")

const revolutCsv = [
  "Date started (UTC),Date completed (UTC),ID,State,Description,Reference,Payer,Amount",
  "2031-04-02,2031-04-02,rev-id-0001,COMPLETED,Software,,, -25.50",
].join("\n")

const openingEntries = [
  {
    id: "unicaja-opening",
    date: "2031-04-01",
    concept: "Saldo arrastrado",
    bankName: "Unicaja",
    balance: 100,
  },
  {
    id: "revolut-opening",
    date: "2031-04-01",
    concept: "Saldo arrastrado",
    bankName: "Revolut",
    balance: 200,
  },
]

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

describe("generateCashflowForQuarter", () => {
  it("keeps cashflow idempotent and writes UI-format logs for each run", async () => {
    const root = await createDataRepo(openingEntries)
    const importDirectory = path.join(root, "import")
    const sourceFiles = {
      unicaja: path.join(
        importDirectory,
        "Unicaja-account-statement_2031-01_2031-06.csv"
      ),
      revolut: path.join(
        importDirectory,
        "Revolut-account-statement_2031-01_2031-06.csv"
      ),
    }
    await writeFile(sourceFiles.unicaja, `\uFEFF${unicajaCsv}`)
    await writeFile(sourceFiles.revolut, revolutCsv)
    const otherQuarterPath = path.join(root, "2031.1Q", "cashflow.json")
    await mkdir(path.dirname(otherQuarterPath), { recursive: true })
    await writeFile(otherQuarterPath, "leave unchanged\n")
    const originalUnicaja = await readFile(sourceFiles.unicaja, "utf8")
    const originalRevolut = await readFile(sourceFiles.revolut, "utf8")

    const first = await generateCashflowForQuarter({
      quarterId: "2031.2Q",
      dataRepoPath: root,
      now: new Date("2031-07-12T09:00:00.000Z"),
    })

    expect(first.changed).toBe(true)
    expect(first.sources.map(({ bank }) => bank)).toEqual([
      "Revolut",
      "Unicaja",
    ])
    expect(first.totals).toEqual({
      created: 2,
      existing: 0,
      ignored: 0,
      sequenceFixed: 0,
    })
    expect(first.sources.map(({ logFile }) => logFile)).toEqual([
      "import/Revolut-account-statement_2031-01_2031-06.peris-2031-07-12T09-00-00.000Z.log.txt",
      "import/Unicaja-account-statement_2031-01_2031-06.peris-2031-07-12T09-00-00.000Z.log.txt",
    ])
    const firstLogs = await Promise.all(
      first.sources.map(({ logFile }) =>
        readFile(path.join(root, logFile), "utf8")
      )
    )
    expect(firstLogs[0]).toContain(
      "Archivo: Revolut-account-statement_2031-01_2031-06.csv"
    )
    expect(firstLogs[0]).toContain("Creado\tL2\t2031-04-02\t-25.50\tSoftware")
    expect(firstLogs[0]).toContain("Creado: 1")
    expect(firstLogs[1]).toContain(
      "Archivo: Unicaja-account-statement_2031-01_2031-06.csv"
    )
    expect(firstLogs[1]).toContain("Creado\tL2\t2031-04-02\t-10.00\tPurchase")

    const entries = JSON.parse(
      await readFile(path.join(root, "2031.2Q", "cashflow.json"), "utf8")
    )
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "unicaja-opening",
          bankName: "Unicaja",
          balance: 100,
        }),
        expect.objectContaining({
          id: "rev-id-0",
          bankName: "Revolut",
          expense: 25.5,
          balance: 174.5,
        }),
        expect.objectContaining({
          id: "cf-1",
          bankName: "Unicaja",
          expense: 10,
          balance: 90,
          bankSequence: 1001,
        }),
      ])
    )

    const second = await generateCashflowForQuarter({
      quarterId: "2031.2Q",
      dataRepoPath: root,
      now: new Date("2031-07-12T09:01:00.000Z"),
    })

    expect(second.changed).toBe(false)
    expect(second.totals.created).toBe(0)
    expect(
      second.sources.every(({ logFile }) => logFile.includes("09-01-00.000Z"))
    ).toBe(true)
    expect(
      await readFile(path.join(root, second.sources[0].logFile), "utf8")
    ).toContain("Existente\tL2\t2031-04-02\t-25.50\tSoftware")
    expect(await readFile(sourceFiles.unicaja, "utf8")).toBe(originalUnicaja)
    expect(await readFile(sourceFiles.revolut, "utf8")).toBe(originalRevolut)
    expect(await readFile(otherQuarterPath, "utf8")).toBe("leave unchanged\n")
    expect(await readFile(sourceFiles.unicaja, "utf8")).toBe(originalUnicaja)
  })

  it("refuses overlapping statements instead of importing one bank in batches", async () => {
    const root = await createDataRepo(openingEntries)
    await writeFile(
      path.join(
        root,
        "import",
        "Revolut-account-statement_2031-01_2031-06.csv"
      ),
      revolutCsv
    )
    await writeFile(
      path.join(
        root,
        "import",
        "Revolut-account-statement_2031-04_2031-05.csv"
      ),
      revolutCsv.replace("rev-id-0001", "rev-id-0002")
    )
    await writeFile(
      path.join(
        root,
        "import",
        "Unicaja-account-statement_2031-01_2031-06.csv"
      ),
      unicajaCsv
    )
    const before = await readFile(
      path.join(root, "2031.2Q", "cashflow.json"),
      "utf8"
    )

    await expect(
      generateCashflowForQuarter({
        quarterId: "2031.2Q",
        dataRepoPath: root,
      })
    ).rejects.toThrow(/Multiple Revolut CSVs contain 2031.2Q/)

    expect(
      await readFile(path.join(root, "2031.2Q", "cashflow.json"), "utf8")
    ).toBe(before)
  })

  it("does not combine disjoint partial statements to cover a quarter", async () => {
    const root = await createDataRepo(openingEntries)
    await writeFile(
      path.join(
        root,
        "import",
        "Revolut-account-statement_2031-04_2031-05.csv"
      ),
      revolutCsv
    )
    await writeFile(
      path.join(
        root,
        "import",
        "Revolut-account-statement_2031-06_2031-06.csv"
      ),
      revolutCsv
        .replaceAll("2031-04-02", "2031-06-02")
        .replace("rev-id-0001", "rev-id-0002")
    )
    await writeFile(
      path.join(
        root,
        "import",
        "Unicaja-account-statement_2031-01_2031-06.csv"
      ),
      unicajaCsv
    )
    const before = await readFile(
      path.join(root, "2031.2Q", "cashflow.json"),
      "utf8"
    )

    await expect(
      generateCashflowForQuarter({
        quarterId: "2031.2Q",
        dataRepoPath: root,
      })
    ).rejects.toThrow(/Expected exactly one Revolut CSV .* found 0/)

    expect(
      await readFile(path.join(root, "2031.2Q", "cashflow.json"), "utf8")
    ).toBe(before)
  })

  it("does not overwrite an existing generated import log", async () => {
    const root = await createDataRepo([openingEntries[1]])
    const fileName = "Revolut-account-statement_2031-01_2031-06.csv"
    await writeFile(path.join(root, "import", fileName), revolutCsv)
    const logPath = path.join(
      root,
      "import",
      "Revolut-account-statement_2031-01_2031-06.peris-2031-07-12T09-00-00.000Z.log.txt"
    )
    await writeFile(logPath, "preserve this earlier log\n")
    const cashflowPath = path.join(root, "2031.2Q", "cashflow.json")
    const before = await readFile(cashflowPath, "utf8")

    await expect(
      generateCashflowForQuarter({
        quarterId: "2031.2Q",
        dataRepoPath: root,
        now: new Date("2031-07-12T09:00:00.000Z"),
      })
    ).rejects.toThrow(/Refusing to overwrite existing import log/)

    expect(await readFile(logPath, "utf8")).toBe("preserve this earlier log\n")
    expect(await readFile(cashflowPath, "utf8")).toBe(before)
  })

  it("refuses to calculate a bank balance without an existing baseline", async () => {
    const root = await createDataRepo([openingEntries[0]])
    const sourceFile = path.join(
      root,
      "import",
      "Revolut-account-statement_2031-01_2031-06.csv"
    )
    await writeFile(sourceFile, revolutCsv)
    await writeFile(
      path.join(
        root,
        "import",
        "Unicaja-account-statement_2031-01_2031-06.csv"
      ),
      unicajaCsv
    )
    const before = await readFile(
      path.join(root, "2031.2Q", "cashflow.json"),
      "utf8"
    )

    await expect(
      generateCashflowForQuarter({
        quarterId: "2031.2Q",
        dataRepoPath: root,
      })
    ).rejects.toThrow(/no existing Revolut baseline/i)

    expect(
      await readFile(path.join(root, "2031.2Q", "cashflow.json"), "utf8")
    ).toBe(before)
  })

  it("rejects invalid quarter identifiers", async () => {
    await expect(
      generateCashflowForQuarter({
        quarterId: "2031.Q2",
        dataRepoPath: "/not-used",
      })
    ).rejects.toThrow(/expected YYYY.NQ/)
  })
})
