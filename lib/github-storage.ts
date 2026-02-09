"use client"

import { Octokit } from "@octokit/rest"
import { parseStorageUrl } from "./storage-types"
import { QuarterData, Invoice, Expense, CashflowEntry } from "./types"

export interface CashflowFileData {
  companyName: string
  carryOver: number
  entries: CashflowEntry[]
}

export class GitHubStorageService {
  private octokit: Octokit
  private owner: string
  private repo: string
  private dataPath: string

  constructor(url: string) {
    const parsed = parseStorageUrl(url)
    if (!parsed) {
      throw new Error(`Invalid GitHub repository URL: ${url}`)
    }

    this.owner = parsed.owner
    this.repo = parsed.repo
    this.dataPath = parsed.dataPath
    this.octokit = new Octokit({
      auth: parsed.token || undefined,
    })
  }

  /**
   * Validates that the repository is accessible with the given credentials
   */
  async validateAccess(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      })
      return { valid: true }
    } catch (error) {
      const err = error as any
      if (err.status === 404) {
        return { valid: false, error: "Repository not found" }
      }
      if (err.status === 401) {
        return { valid: false, error: "Invalid authentication token" }
      }
      return {
        valid: false,
        error: err.message || "Unable to access repository",
      }
    }
  }

  /**
   * Lists all available quarter folders in the repository
   */
  async listQuarters(): Promise<string[]> {
    try {
      const path = this.dataPath || ""
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: path || "/",
      })

      if (!Array.isArray(response.data)) {
        return []
      }

      return response.data
        .filter(
          (item) =>
            (item as any).type === "dir" &&
            (item as any).name.match(/^\d{4}\.\d[QqTt]$/)
        )
        .map((item) => (item as any).name)
    } catch (error) {
      console.error("Error listing quarters:", error)
      throw error
    }
  }

  /**
   * Fetches a file from the quarter folder
   */
  async fetchQuarterFile(quarterId: string, fileName: string): Promise<any> {
    const filePath = this.dataPath
      ? `${this.dataPath}/${quarterId}/${fileName}`
      : `${quarterId}/${fileName}`

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      })

      if (typeof response.data === "object" && !Array.isArray(response.data)) {
        const content = Buffer.from(
          (response.data as any).content,
          "base64"
        ).toString("utf-8")
        return JSON.parse(content)
      }

      return null
    } catch (error) {
      const err = error as any
      if (err.status === 404) {
        throw new Error(`File ${filePath} does not exist`)
      }
      if (err instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${filePath}: ${err.message}`)
      }
      throw new Error(
        `Failed to fetch ${filePath}: ${err.message || String(error)}`
      )
    }
  }

  /**
   * Creates or updates a file in the repository
   */
  async createOrUpdateFile(
    quarterId: string,
    fileName: string,
    content: any,
    message: string
  ): Promise<void> {
    const filePath = this.dataPath
      ? `${this.dataPath}/${quarterId}/${fileName}`
      : `${quarterId}/${fileName}`

    try {
      // Try to get existing file to get its SHA (needed for updates)
      let sha: string | undefined
      try {
        const response = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
        })
        if (
          typeof response.data === "object" &&
          !Array.isArray(response.data)
        ) {
          sha = (response.data as any).sha
        }
      } catch (error) {
        // File doesn't exist, that's ok for creation
      }

      // Create or update the file
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString(
          "base64"
        ),
        sha,
      })
    } catch (error) {
      const err = error as any
      throw new Error(
        `Failed to create/update ${filePath}: ${err.message || String(error)}`
      )
    }
  }
}
