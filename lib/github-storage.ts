"use client"

import { Octokit } from "@octokit/rest"
import { parseStorageUrl } from "./storage-types"
import { QuarterData, Invoice, Expense, CashflowEntry } from "./types"

export interface CashflowFileData {
  companyName: string
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
   * Lists all files in a specific folder within a quarter
   */
  async listFilesInFolder(
    quarterId: string,
    folderType: "invoices" | "expenses"
  ): Promise<string[]> {
    const folderPath = this.dataPath
      ? `${this.dataPath}/${quarterId}/${folderType}`
      : `${quarterId}/${folderType}`

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: folderPath,
      })

      if (!Array.isArray(response.data)) {
        return []
      }

      return response.data
        .filter((item) => (item as any).type === "file")
        .map((item) => (item as any).name)
    } catch (error) {
      const err = error as any
      if (err.status === 404) {
        return []
      }
      console.error(`Error listing files in ${folderPath}:`, error)
      return []
    }
  }

  /**
   * Fetches a file from the quarter folder
   */
  async fetchQuarterFile(
    quarterId: string,
    fileName: string
  ): Promise<{ data: any; sha: string }> {
    const filePath = this.dataPath
      ? `${this.dataPath}/${quarterId}/${fileName}`
      : `${quarterId}/${fileName}`

    return this.fetchFilePath(filePath)
  }

  /**
   * Fetches a file from the repository root (or dataPath root)
   */
  async fetchRootFile(fileName: string): Promise<{ data: any; sha: string }> {
    const filePath = this.dataPath
      ? `${this.dataPath}/${fileName}`
      : fileName

    return this.fetchFilePath(filePath)
  }

  private async fetchFilePath(
    filePath: string
  ): Promise<{ data: any; sha: string }> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      })

      if (typeof response.data === "object" && !Array.isArray(response.data)) {
        const fileData = response.data as any
        const content = Buffer.from(fileData.content, "base64").toString(
          "utf-8"
        )
        return {
          data: JSON.parse(content),
          sha: fileData.sha,
        }
      }

      throw new Error(`Invalid response for ${filePath}`)
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
   * Commits multiple files (JSON and binary) in a single commit using Git Data API
   */
  async commitMultipleFiles(
    jsonFiles: Array<{
      quarterId: string
      fileName: string
      content: any
      sha?: string
      isBinary: false
    }>,
    binaryFiles: Array<{
      quarterId: string
      fileName: string
      content: ArrayBuffer
      isBinary: true
    }> = [],
    message: string
  ): Promise<void> {
    try {
      const repoInfo = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      })
      const branch = repoInfo.data.default_branch

      const ref = await this.octokit.rest.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
      })
      const latestCommitSha = ref.data.object.sha

      const commit = await this.octokit.rest.git.getCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: latestCommitSha,
      })
      const baseTreeSha = commit.data.tree.sha

      const allFiles = [
        ...jsonFiles.map((file) => ({
          ...file,
          isBinary: false as const,
        })),
        ...binaryFiles.map((file) => ({
          ...file,
          isBinary: true as const,
        })),
      ]

      const tree = await Promise.all(
        allFiles.map(async (file) => {
          const filePath = this.dataPath
            ? `${this.dataPath}/${file.quarterId}/${file.fileName}`
            : `${file.quarterId}/${file.fileName}`

          let blobSha: string

          if (file.isBinary) {
            // For binary files, convert ArrayBuffer to base64 in chunks
            const binaryFile = file as any
            const uint8Array = new Uint8Array(binaryFile.content)
            const chunkSize = 0x8000
            let binaryString = ""
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.subarray(i, i + chunkSize)
              binaryString += String.fromCharCode(...chunk)
            }
            const base64Content = btoa(binaryString)

            const blob = await this.octokit.rest.git.createBlob({
              owner: this.owner,
              repo: this.repo,
              content: base64Content,
              encoding: "base64",
            })
            blobSha = blob.data.sha
          } else {
            const blob = await this.octokit.rest.git.createBlob({
              owner: this.owner,
              repo: this.repo,
              content: Buffer.from(
                JSON.stringify(file.content, null, 2)
              ).toString("base64"),
              encoding: "base64",
            })
            blobSha = blob.data.sha
          }

          return {
            path: filePath,
            mode: "100644" as const,
            type: "blob" as const,
            sha: blobSha,
          }
        })
      )

      const newTree = await this.octokit.rest.git.createTree({
        owner: this.owner,
        repo: this.repo,
        base_tree: baseTreeSha,
        tree,
      })

      const newCommit = await this.octokit.rest.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        message,
        tree: newTree.data.sha,
        parents: [latestCommitSha],
      })

      await this.octokit.rest.git.updateRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
        sha: newCommit.data.sha,
      })
    } catch (error) {
      const err = error as any
      throw new Error(`Failed to commit files: ${err.message || String(error)}`)
    }
  }
}
