import { StorageConfig } from "./storage-types"

const STORAGE_CONFIG_KEY = "peris_storage_config"

export function loadStorageConfig(): StorageConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_CONFIG_KEY)
    if (!stored) return null
    return JSON.parse(stored) as StorageConfig
  } catch (error) {
    console.error("Failed to load storage config from localStorage:", error)
    return null
  }
}

export function saveStorageConfig(config: StorageConfig): void {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error("Failed to save storage config to localStorage:", error)
  }
}
