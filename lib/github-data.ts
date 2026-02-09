"use client"

import { GitHubStorageService } from "./github-storage"
import { Storage } from "./storage-types"

/**
 * Lists available quarters in a storage
 */
export async function listQuartersInStorage(
  storage: Storage
): Promise<string[]> {
  const service = new GitHubStorageService(storage.url)
  return await service.listQuarters()
}

/**
 * Validates access to a storage
 */
export async function validateStorageAccess(storage: Storage): Promise<{
  valid: boolean
  error?: string
}> {
  try {
    const service = new GitHubStorageService(storage.url)
    return await service.validateAccess()
  } catch (error) {
    return { valid: false, error: String(error) }
  }
}

/**
 * Loads a ledger file for a specific quarter
 */
export async function loadFileFromQuarter<T>(
  storage: Storage,
  quarterId: string,
  ledgerFileName: string
): Promise<{ data: T | null; sha?: string; error?: string }> {
  try {
    const service = new GitHubStorageService(storage.url)
    const result = await service.fetchQuarterFile(
      quarterId,
      `${ledgerFileName}.json`
    )
    return { data: result.data, sha: result.sha }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { data: null, error: message }
  }
}

export async function commitEditingFiles(
  storage: Storage,
  editingFiles: Array<{
    quarterId: string
    fileName: string
    data: any
    sha?: string
  }>
): Promise<void> {
  const service = new GitHubStorageService(storage.url)

  for (const file of editingFiles) {
    await service.createOrUpdateFile(
      file.quarterId,
      `${file.fileName}.json`,
      file.data,
      `Update ${file.quarterId}/${file.fileName}.json`,
      file.sha
    )
  }
}
