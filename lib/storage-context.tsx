"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { Storage, StorageConfig } from "./storage-types"
import { loadStorageConfig, saveStorageConfig } from "./storage-persistence"
const SAMPLE_STORAGE: Storage = {
  name: "Sample Data",
  url: "https://github.com/pablonete/peris-sample-data",
}

interface StorageContextType {
  storages: Storage[]
  activeStorage: Storage
  isSample: boolean
  setActiveStorage: (storageName: string) => void
  addStorage: (storage: Storage) => void
  removeStorage: (storageName: string) => void
}

const StorageContext = createContext<StorageContextType | undefined>(undefined)

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [userStorages, setUserStorages] = useState<Storage[]>(() => {
    const config = loadStorageConfig()
    return config && config.storages.length > 0 ? config.storages : []
  })
  const [activeStorageName, setActiveStorageName] = useState<string>(() => {
    const config = loadStorageConfig()
    return config?.activeStorageName || SAMPLE_STORAGE.name
  })

  useEffect(() => {
    const config: StorageConfig = {
      storages: userStorages,
      activeStorageName,
    }
    saveStorageConfig(config)
  }, [userStorages, activeStorageName])

  const storages = [...userStorages, SAMPLE_STORAGE]

  const userActiveStorage = userStorages.find(
    (storage) => storage.name === activeStorageName
  )
  const activeStorage = userActiveStorage || SAMPLE_STORAGE
  const isSample = !userActiveStorage

  const setActiveStorage = (storageName: string) => {
    const storage = storages.find((s) => s.name === storageName)
    if (storage) {
      setActiveStorageName(storageName)
    }
  }

  const addStorage = (storage: Storage) => {
    setUserStorages((prev) => {
      const exists = prev.some((s) => s.name === storage.name)
      if (exists) {
        throw new Error(`Storage with name "${storage.name}" already exists`)
      }
      return [...prev, storage]
    })
  }

  const removeStorage = (storageName: string) => {
    if (storageName === SAMPLE_STORAGE.name) {
      console.warn("Cannot remove default sample data storage")
      return
    }
    setUserStorages((prev) => prev.filter((s) => s.name !== storageName))
    if (activeStorageName === storageName) {
      setActiveStorageName(SAMPLE_STORAGE.name)
    }
  }

  return (
    <StorageContext.Provider
      value={{
        storages,
        activeStorage,
        isSample,
        setActiveStorage,
        addStorage,
        removeStorage,
      }}
    >
      {children}
    </StorageContext.Provider>
  )
}

export function useStorage() {
  const context = useContext(StorageContext)
  if (context === undefined) {
    throw new Error("useStorage must be used within a StorageProvider")
  }
  return context
}
