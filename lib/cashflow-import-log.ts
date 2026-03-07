import { CashflowImportMovement } from "./cashflow-import-definitions"
import { CashflowEntry } from "./types"
import type { CashflowImportSummary } from "./cashflow-import"

export interface CashflowImportLogRecord {
  action: string
  line: number
  date: string
  amount: string
  concept: string
  detail: string
}

export function buildCashflowImportLogContent(
  fileName: string,
  quarterId: string,
  records: CashflowImportLogRecord[],
  entries: CashflowEntry[],
  summary: CashflowImportSummary
): string {
  const sequences = new Map(
    entries.map((entry) => [entry.id, entry.bankSequence])
  )
  const details = records.map((record) => {
    const sequenceSuffix = sequences.has(record.detail)
      ? ` (seq ${sequences.get(record.detail) ?? "-"})`
      : ""

    return `${record.action}\tL${record.line}\t${record.date}\t${record.amount}\t${record.concept}\t${record.detail}${sequenceSuffix}`
  })

  return [
    `Archivo: ${fileName}`,
    `Trimestre: ${quarterId}`,
    "",
    ...details,
    "",
    "Resumen",
    `Procesadas: ${summary.processed}`,
    `Otro trimestre: ${summary.otherQuarter}`,
    `Existente: ${summary.existing}`,
    `Creado: ${summary.created}`,
    `Ignorado: ${summary.ignored}`,
    `Secuencia corregida: ${summary.sequenceFixed}`,
    "",
  ].join("\n")
}

export function makeCashflowImportLogRecord(
  movement: CashflowImportMovement,
  action: string,
  detail: string
): CashflowImportLogRecord {
  return {
    action,
    line: movement.sourceLine,
    date: movement.date,
    amount: movement.amount.toFixed(2),
    concept: movement.concept,
    detail,
  }
}

export function createCashflowImportLogPath(
  fileName: string,
  now: Date
): string {
  const stamp = now.toISOString().replace(/[:]/g, "-")
  const baseName = fileName.replace(/\.[^.]+$/, "")
  return `import/${baseName}.peris-${stamp}.log.txt`
}
