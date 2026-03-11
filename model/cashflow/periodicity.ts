import { CashflowEntry } from "@/lib/types"

export type Periodicity = CashflowEntry["periodicity"]

export const PERIODICITY_OPTIONS: NonNullable<Periodicity>[] = [
  "1mo",
  "3mo",
  "1y",
]
