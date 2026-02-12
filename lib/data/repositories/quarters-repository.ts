"use client"

import { GitHubStorageService } from "../infrastructure/github-storage"
import { Storage } from "../infrastructure/storage-types"

/**
 * Repository for managing quarters
 */
export class QuartersRepository {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  /**
   * List all available quarters in the storage
   */
  async list(): Promise<string[]> {
    const service = new GitHubStorageService(this.storage.url)
    return await service.listQuarters()
  }

  /**
   * Validate that the storage is accessible
   */
  async validateAccess(): Promise<{ valid: boolean; error?: string }> {
    try {
      const service = new GitHubStorageService(this.storage.url)
      return await service.validateAccess()
    } catch (error) {
      return { valid: false, error: String(error) }
    }
  }
}
