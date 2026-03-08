"use client"

import { GitHubStorageService } from "./github-storage"
import { Storage } from "./storage-types"

export interface EditingTextFile {
  path: string
  content: any
  sha?: string
  contentType?: "json" | "text"
}

export interface EditingBinaryFile {
  path: string
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

export async function listFilesInStorage(
  storage: Storage,
  folderPath: string
): Promise<string[]> {
  const service = new GitHubStorageService(storage.url)
  return await service.listFiles(folderPath)
}

export async function loadJsonFile<T>(
  storage: Storage,
  filePath: string
): Promise<{ data: T | null; sha?: string; error?: string }> {
  try {
    const service = new GitHubStorageService(storage.url)
    const result = await service.fetchJsonFile(filePath)
    return { data: result.data, sha: result.sha }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { data: null, error: message }
  }
}

export async function loadTextFile(
  storage: Storage,
  filePath: string
): Promise<{ data: string | null; sha?: string; error?: string }> {
  try {
    const service = new GitHubStorageService(storage.url)
    const result = await service.fetchTextFile(filePath)
    return { data: result.data, sha: result.sha }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { data: null, error: message }
  }
}

export async function commitEditingFiles(
  storage: Storage,
  textFiles: EditingTextFile[],
  binaryFiles: EditingBinaryFile[] = []
): Promise<void> {
  const service = new GitHubStorageService(storage.url)
  const fileCount = textFiles.length + binaryFiles.length
  const quarterIds = Array.from(
    new Set(
      [...textFiles, ...binaryFiles]
        .map((file) => getQuarterIdFromPath(file.path))
        .filter((quarterId): quarterId is string => Boolean(quarterId))
    )
  )

  let message = `Update ${fileCount} files`
  if (
    fileCount === 1 &&
    textFiles.length === 1 &&
    textFiles[0].path === "peris.json"
  ) {
    message = "Add peris.json"
  } else if (quarterIds.length === 1) {
    message = `Update ${quarterIds[0]} (${fileCount} files)`
  } else if (quarterIds.length > 1) {
    message = `Update ${quarterIds.length} quarters (${fileCount} files)`
  }

  await service.commitMultipleFiles(textFiles, binaryFiles, message)
}

function getQuarterIdFromPath(path: string): string | null {
  const [segment] = path.split("/")
  return segment.match(/^\d{4}\.\d[QqTt]$/) ? segment : null
}
