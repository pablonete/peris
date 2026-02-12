"use client"

import { GitHubStorageService, CashflowFileData } from "../infrastructure/github-storage"
import { Storage } from "../infrastructure/storage-types"

export interface FileResult<T> {
  data: T | null
  sha?: string
  error?: string
}

/**
 * Repository for managing cashflow
 */
export class CashflowRepository {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  /**
   * Load cashflow for a specific quarter
   */
  async load(quarterId: string): Promise<FileResult<CashflowFileData>> {
    try {
      const service = new GitHubStorageService(this.storage.url)
      const result = await service.fetchQuarterFile(quarterId, "cashflow.json")

      if (!result.data) {
        return { data: null, error: "File not found" }
      }

      const data = result.data as CashflowFileData
      return { data, sha: result.sha }
    } catch (error) {
      return { data: null, error: String(error) }
    }
  }

  /**
   * Save cashflow for a specific quarter
   * Note: Actual saving is coordinated through the DataContext's commit mechanism
   */
  async save(
    quarterId: string,
    cashflow: CashflowFileData,
    sha?: string
  ): Promise<void> {
    // This is handled by the commit mechanism in DataContext
    // The repository just validates the data structure
    if (
      !cashflow ||
      typeof cashflow !== "object" ||
      !Array.isArray(cashflow.entries)
    ) {
      throw new Error("Invalid cashflow data structure")
    }
  }
}
