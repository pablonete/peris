"use client"

import { GitHubStorageService } from "../infrastructure/github-storage"
import { Storage } from "../infrastructure/storage-types"

export interface FileResult<T> {
  data: T | null
  sha?: string
  error?: string
}

/**
 * Generic repository for managing quarter files (invoices, expenses, cashflow)
 */
export class QuarterFileRepository<T> {
  private storage: Storage
  private fileName: string

  constructor(storage: Storage, fileName: string) {
    this.storage = storage
    this.fileName = fileName
  }

  /**
   * Get content for a specific quarter file
   * Returns the data from GitHub
   */
  async getContent(quarterId: string): Promise<FileResult<T>> {
    try {
      const service = new GitHubStorageService(this.storage.url)
      const result = await service.fetchQuarterFile(
        quarterId,
        `${this.fileName}.json`
      )

      if (!result.data) {
        return { data: null, error: "File not found" }
      }

      const data = result.data as T
      return { data, sha: result.sha }
    } catch (error) {
      return { data: null, error: String(error) }
    }
  }
}
