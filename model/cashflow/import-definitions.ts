import { parseCsvRecords } from "@/lib/csv-utils"

export type CashflowImportBank = "revolut"

export interface CashflowImportMovement {
  externalId: string
  sourceLine: number
  date: string
  matchDates: string[]
  concept: string
  income?: number
  expense?: number
  amount: number
  skipReason?: string
}

export interface CashflowImportDefinition {
  id: CashflowImportBank
  label: string
  fileExtension: ".csv"
  columns: Record<string, string>
  parse: (content: string) => CashflowImportMovement[]
}

const revolutColumns = {
  startedDate: "Date started (UTC)",
  completedDate: "Date completed (UTC)",
  id: "ID",
  state: "State",
  description: "Description",
  reference: "Reference",
  payer: "Payer",
  amount: "Amount",
} as const

const revolutImportDefinition: CashflowImportDefinition = {
  id: "revolut",
  label: "Revolut",
  fileExtension: ".csv",
  columns: revolutColumns,
  parse(content) {
    return parseCsvRecords(content).map((row, index) => {
      const externalId = getImportRowId(row, index)
      const startedDate = row[revolutColumns.startedDate]?.trim()
      const completedDate = row[revolutColumns.completedDate]?.trim()
      const amount = parseAmount(row[revolutColumns.amount])
      const state = row[revolutColumns.state]?.trim()

      if (!completedDate || amount == null) {
        return {
          externalId,
          sourceLine: index + 2,
          date: completedDate || startedDate || "",
          matchDates: compactDates([completedDate, startedDate]),
          concept: getRevolutConcept(row),
          amount: amount ?? 0,
          skipReason: "Fila incompleta",
        }
      }

      if (state !== "COMPLETED") {
        return {
          externalId,
          sourceLine: index + 2,
          date: completedDate,
          matchDates: compactDates([completedDate, startedDate]),
          concept: getRevolutConcept(row),
          amount,
          skipReason: `Estado ${state || "desconocido"}`,
        }
      }

      return {
        externalId,
        sourceLine: index + 2,
        date: completedDate,
        matchDates: compactDates([completedDate, startedDate]),
        concept: getRevolutConcept(row),
        amount,
        income: amount > 0 ? amount : undefined,
        expense: amount < 0 ? Math.abs(amount) : undefined,
      }
    })
  },
}

export const cashflowImportDefinitions = [revolutImportDefinition]

export function getCashflowImportDefinition(
  bank: CashflowImportBank
): CashflowImportDefinition {
  const definition = cashflowImportDefinitions.find((item) => item.id === bank)
  if (!definition) {
    throw new Error(`Unsupported bank import: ${bank}`)
  }
  return definition
}

function getRevolutConcept(row: Record<string, string>): string {
  return (
    row[revolutColumns.reference]?.trim() ||
    row[revolutColumns.description]?.trim() ||
    row[revolutColumns.payer]?.trim() ||
    "Movimiento importado"
  )
}

function parseAmount(value: string | undefined): number | undefined {
  if (!value) return undefined
  const normalized = normalizeAmount(value.trim())
  const parsed = Number.parseFloat(normalized)
  if (Number.isNaN(parsed)) return undefined
  return Math.round(parsed * 100) / 100
}

function getImportRowId(row: Record<string, string>, index: number): string {
  return row[revolutColumns.id] || `row-${index + 2}`
}

function normalizeAmount(value: string): string {
  if (value.includes(".") && value.includes(",")) {
    return value.lastIndexOf(",") > value.lastIndexOf(".")
      ? value.replaceAll(".", "").replace(",", ".")
      : value.replaceAll(",", "")
  }

  return value.includes(",") ? value.replace(",", ".") : value
}

function compactDates(dates: Array<string | undefined>): string[] {
  return Array.from(
    new Set(dates.filter((value): value is string => Boolean(value)))
  )
}
