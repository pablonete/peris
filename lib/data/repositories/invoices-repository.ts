"use client"

import { GitHubStorageService } from "../infrastructure/github-storage"
import { Storage } from "../infrastructure/storage-types"
import { Invoice } from "@/lib/types"

export interface FileResult<T> {
  data: T | null
  sha?: string
  error?: string
}

/**
 * Repository for managing invoices
 */
export class InvoicesRepository {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  /**
   * Load invoices for a specific quarter
   */
  async load(quarterId: string): Promise<FileResult<Invoice[]>> {
    try {
      const service = new GitHubStorageService(this.storage.url)
      const result = await service.fetchQuarterFile(
        quarterId,
        "invoices.json"
      )

      if (!result.data) {
        return { data: null, error: "File not found" }
      }

      const data = result.data as Invoice[]
      return { data, sha: result.sha }
    } catch (error) {
      return { data: null, error: String(error) }
    }
  }

  /**
   * Save invoices for a specific quarter
   * Note: Actual saving is coordinated through the DataContext's commit mechanism
   */
  async save(
    quarterId: string,
    invoices: Invoice[],
    sha?: string
  ): Promise<void> {
    // This is handled by the commit mechanism in DataContext
    // The repository just validates the data structure
    if (!Array.isArray(invoices)) {
      throw new Error("Invoices must be an array")
    }
  }
}
