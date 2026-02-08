export interface Storage {
  name: string
  url: string // Format: https://PAT@github.com/owner/repo/path/to/data (URL is the unique identifier)
}

export interface ParsedStorage {
  owner: string
  repo: string
  token?: string
  dataPath: string
}

export interface StorageConfig {
  storages: Storage[]
  activeStorageName: string
}

/**
 * Parse a GitHub repository URL in the format:
 * https://[PAT@]github.com/owner/repo[/path/to/data]
 */
export function parseStorageUrl(url: string): ParsedStorage | null {
  try {
    const urlObj = new URL(url)

    // Extract token if present in the URL
    let token: string | undefined
    if (urlObj.username) {
      token = urlObj.username
      if (urlObj.password) {
        token = `${urlObj.username}:${urlObj.password}`
      }
    }

    // Get pathname and split by /
    const parts = urlObj.pathname.split("/").filter((p) => p.length > 0)

    if (parts.length < 2) {
      throw new Error("URL must contain owner and repo")
    }

    const owner = parts[0]
    const repo = parts[1]
    const dataPath = parts.length > 2 ? parts.slice(2).join("/") : ""

    return { owner, repo, token, dataPath }
  } catch (error) {
    console.error("Failed to parse storage URL:", error)
    return null
  }
}
