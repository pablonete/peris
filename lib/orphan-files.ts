"use client"

import { Invoice, Expense } from "./types"
import { listFilesInStorage } from "./github-data"
import { Storage } from "./storage-types"

/**
 * Get all orphan files (files not linked to any invoice/expense) in a quarter folder
 */
export async function getOrphanFiles(
  storage: Storage,
  quarterId: string,
  type: "invoices" | "expenses",
  linkedItems: Invoice[] | Expense[]
): Promise<string[]> {
  const allFiles = await listFilesInStorage(storage, `${quarterId}/${type}`)

  const linkedFilenames = new Set(
    linkedItems
      .map((item) => item.filename)
      .filter((filename): filename is string => !!filename)
  )

  return allFiles.filter((filename) => !linkedFilenames.has(filename))
}
