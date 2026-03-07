"use client"

import { Octokit } from "@octokit/rest"
import { parseStorageUrl } from "./storage-types"

/**
 * Minimal shape used from GitHub's contents API for both files and directories.
 * Directory entries use `type` and `name`, while file entries also expose `content` and `sha`.
 */
interface GitHubContentEntry {
  type?: string
  name?: string
  content?: string
  sha?: string
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
            castToGitHubContentEntry(item).type === "dir" &&
            castToGitHubContentEntry(item).name?.match(/^\d{4}\.\d[QqTt]$/)
        )
        .flatMap((item) => {
          const name = castToGitHubContentEntry(item).name
          return name ? [name] : []
        })
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
        .filter((item) => castToGitHubContentEntry(item).type === "file")
        .flatMap((item) => {
          const name = castToGitHubContentEntry(item).name
          return name ? [name] : []
        })
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
   * Lists all files in a folder relative to the data path root.
   */
  async listRootFolderFiles(folderPath: string): Promise<string[]> {
    const fullPath = this.dataPath
      ? `${this.dataPath}/${folderPath}`
      : folderPath

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      })

      if (!Array.isArray(response.data)) {
        return []
      }

      return response.data
        .filter((item) => castToGitHubContentEntry(item).type === "file")
        .flatMap((item) => {
          const name = castToGitHubContentEntry(item).name
          return name ? [name] : []
        })
    } catch (error) {
      const err = error as any
      if (err.status === 404) {
        return []
      }
      console.error(`Error listing files in ${fullPath}:`, error)
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
    const filePath = this.dataPath ? `${this.dataPath}/${fileName}` : fileName

    return this.fetchFilePath(filePath)
  }

  /**
   * Fetches a text file from the repository root (or dataPath root).
   */
  async fetchRootTextFile(
    fileName: string
  ): Promise<{ data: string; sha: string }> {
    const filePath = this.dataPath ? `${this.dataPath}/${fileName}` : fileName
    return this.fetchTextFilePath(filePath)
  }

  private async fetchFilePath(
    filePath: string
  ): Promise<{ data: any; sha: string }> {
    try {
      const result = await this.fetchTextFilePath(filePath)
      return {
        data: JSON.parse(result.data),
        sha: result.sha,
      }
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

  private async fetchTextFilePath(
    filePath: string
  ): Promise<{ data: string; sha: string }> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      })

      if (typeof response.data === "object" && !Array.isArray(response.data)) {
        const fileData = castToGitHubContentEntry(response.data)
        return {
          data: Buffer.from(fileData.content ?? "", "base64").toString("utf-8"),
          sha: fileData.sha ?? "",
        }
      }

      throw new Error(`Invalid response for ${filePath}`)
    } catch (error) {
      const err = error as any
      if (err.status === 404) {
        throw new Error(`File ${filePath} does not exist`)
      }
      throw error
    }
  }

  /**
   * Commits multiple files (JSON and binary) in a single commit using Git Data API
   */
  async commitMultipleFiles(
    jsonFiles: Array<{
      quarterId?: string
      fileName: string
      content: any
      sha?: string
      isBinary: false
      contentType?: "json" | "text"
    }>,
    binaryFiles: Array<{
      quarterId?: string
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
          const filePath = file.quarterId
            ? this.dataPath
              ? `${this.dataPath}/${file.quarterId}/${file.fileName}`
              : `${file.quarterId}/${file.fileName}`
            : this.dataPath
              ? `${this.dataPath}/${file.fileName}`
              : file.fileName

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
                file.contentType === "text"
                  ? String(file.content)
                  : JSON.stringify(file.content, null, 2)
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

function castToGitHubContentEntry(value: unknown): GitHubContentEntry {
  return value as GitHubContentEntry
}
