"use client"

import { GitHubStorageService } from "../infrastructure/github-storage"
import { Storage } from "../infrastructure/storage-types"
import { Expense } from "@/lib/types"

export interface FileResult<T> {
  data: T | null
  sha?: string
  error?: string
}

/**
 * Repository for managing expenses
 */
export class ExpensesRepository {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  /**
   * Load expenses for a specific quarter
   */
  async load(quarterId: string): Promise<FileResult<Expense[]>> {
    try {
      const service = new GitHubStorageService(this.storage.url)
      const result = await service.fetchQuarterFile(quarterId, "expenses.json")

      if (!result.data) {
        return { data: null, error: "File not found" }
      }

      const data = result.data as Expense[]
      return { data, sha: result.sha }
    } catch (error) {
      return { data: null, error: String(error) }
    }
  }

  /**
   * Save expenses for a specific quarter
   * Note: Actual saving is coordinated through the DataContext's commit mechanism
   */
  async save(
    quarterId: string,
    expenses: Expense[],
    sha?: string
  ): Promise<void> {
    // This is handled by the commit mechanism in DataContext
    // The repository just validates the data structure
    if (!Array.isArray(expenses)) {
      throw new Error("Expenses must be an array")
    }
  }
}
