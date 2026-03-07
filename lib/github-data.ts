"use client"

import { GitHubStorageService } from "./github-storage"
import { Storage } from "./storage-types"
import { PerisConfig } from "./types"

export interface EditingAttachment {
  quarterId: string
  filename: string
  content: ArrayBuffer
}

export interface EditingRootTextFile {
  path: string
  content: string
  sha?: string
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

/**
 * Loads the global peris.json config from the root of the data repository
 */
export async function loadPerisConfig(
  storage: Storage
): Promise<{ data: PerisConfig | null; error?: string }> {
  try {
    const service = new GitHubStorageService(storage.url)
    const result = await service.fetchRootFile("peris.json")
    return { data: result.data }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("does not exist")) {
      return { data: null }
    }
    return { data: null, error: message }
  }
}

export async function listRootFolderFiles(
  storage: Storage,
  folderPath: string
): Promise<string[]> {
  const service = new GitHubStorageService(storage.url)
  return await service.listRootFolderFiles(folderPath)
}

export async function loadRootTextFile(
  storage: Storage,
  filePath: string
): Promise<{ data: string | null; sha?: string; error?: string }> {
  try {
    const service = new GitHubStorageService(storage.url)
    const result = await service.fetchRootTextFile(filePath)
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
  attachments: EditingAttachment[] = [],
  perisConfig?: { data: PerisConfig; sha?: string },
  rootTextFiles: EditingRootTextFile[] = []
): Promise<void> {
  const service = new GitHubStorageService(storage.url)

  const uniqueQuarters = Array.from(
    new Set(editingFiles.map((f) => f.quarterId))
  )
  const fileCount =
    editingFiles.length +
    attachments.length +
    rootTextFiles.length +
    (perisConfig ? 1 : 0)
  let message: string
  if (uniqueQuarters.length === 0 && perisConfig) {
    message = "Add peris.json"
  } else if (uniqueQuarters.length === 1) {
    message = `Update ${uniqueQuarters[0]} (${fileCount} files)`
  } else {
    message = `Update ${uniqueQuarters.length} quarters (${fileCount} files)`
  }

  await service.commitMultipleFiles(
    [
      ...editingFiles.map((file) => ({
        quarterId: file.quarterId,
        fileName: `${file.fileName}.json`,
        content: file.data,
        sha: file.sha,
        isBinary: false as const,
      })),
      ...(perisConfig
        ? [
            {
              fileName: "peris.json",
              content: perisConfig.data,
              sha: perisConfig.sha,
              isBinary: false as const,
            },
          ]
        : []),
      ...rootTextFiles.map((file) => ({
        fileName: file.path,
        content: file.content,
        sha: file.sha,
        isBinary: false as const,
        contentType: "text" as const,
      })),
    ],
    attachments.map((att) => ({
      quarterId: att.quarterId,
      fileName: `expenses/${att.filename}`,
      content: att.content,
      isBinary: true as const,
    })),
    message
  )
}
