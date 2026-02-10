"use client"

import { GitHubStorageService } from "./github-storage"
import { Storage } from "./storage-types"

export interface EditingAttachment {
  quarterId: string
  filename: string
  content: ArrayBuffer
}

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
  }>,
  attachments: EditingAttachment[] = []
): Promise<void> {
  const service = new GitHubStorageService(storage.url)

  const uniqueQuarters = Array.from(
    new Set(editingFiles.map((f) => f.quarterId))
  )
  const fileCount = editingFiles.length + attachments.length
  const message =
    uniqueQuarters.length === 1
      ? `Update ${uniqueQuarters[0]} (${fileCount} files)`
      : `Update ${uniqueQuarters.length} quarters (${fileCount} files)`

  await service.commitMultipleFiles(
    editingFiles.map((file) => ({
      quarterId: file.quarterId,
      fileName: `${file.fileName}.json`,
      content: file.data,
      sha: file.sha,
      isBinary: false,
    })),
    attachments.map((att) => ({
      quarterId: att.quarterId,
      fileName: `expenses/${att.filename}`,
      content: att.content,
      isBinary: true as const,
    })),
    message
  )
}
