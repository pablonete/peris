"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Storage,
  StorageConfig,
  getFileUrl,
} from "../infrastructure/storage-types"
import {
  loadStorageConfig,
  saveStorageConfig,
} from "../infrastructure/storage-persistence"
import { QuartersRepository } from "../repositories/quarters-repository"
import { QuarterFileRepository } from "../repositories/quarter-file-repository"
import { Invoice, Expense } from "@/lib/types"
import {
  CashflowFileData,
  GitHubStorageService,
} from "../infrastructure/github-storage"

const SAMPLE_STORAGE: Storage = {
  name: "Sample Data",
  url: "https://github.com/pablonete/peris-sample-data",
}

type LedgerFileName = "invoices" | "expenses" | "cashflow"

interface EditingFile {
  quarterId: string
  fileName: LedgerFileName
  data: Invoice[] | Expense[] | CashflowFileData
  sha?: string
}

interface EditingAttachment {
  quarterId: string
  filename: string
  content: ArrayBuffer
}

// Type mapping for file names to their data types
type FileDataType<T extends LedgerFileName> = T extends "invoices"
  ? Invoice[]
  : T extends "expenses"
    ? Expense[]
    : CashflowFileData

interface FileResult<T> {
  content: T | null
  isPending: boolean
  error: Error | null
  isEditing: boolean
}

interface DataContextType {
  // Storage management
  storages: Storage[]
  activeStorage: Storage
  isSample: boolean
  companyName: string | null
  setActiveStorage: (storageName: string) => void
  addStorage: (storage: Storage) => void
  removeStorage: (storageName: string) => void

  // Quarters
  quarters: string[]
  quartersLoading: boolean
  quartersError: Error | null

  // Data loading - unified method
  getFile: <T extends LedgerFileName>(
    quarterId: string,
    fileName: T
  ) => FileResult<FileDataType<T>>

  // Editing state
  editingFiles: Map<string, EditingFile>
  editingAttachments: Map<string, EditingAttachment>
  editingCount: number
  isCommitting: boolean
  globalError: string | null

  // Editing operations
  isDirtyFile: (quarterId: string, fileName: LedgerFileName) => boolean
  updateFile: (
    quarterId: string,
    fileName: LedgerFileName,
    data: Invoice[] | Expense[] | CashflowFileData,
    sha?: string
  ) => void
  addAttachment: (
    quarterId: string,
    filename: string,
    content: ArrayBuffer
  ) => void
  getAttachment: (
    quarterId: string,
    filename: string
  ) => EditingAttachment | undefined
  removeAttachment: (quarterId: string, filename: string) => void
  createNewQuarter: (quarterId: string, companyName: string) => void
  clearAllEditing: () => void
  commitChanges: () => Promise<void>

  // Utilities
  getFileSha: (quarterId: string, type: LedgerFileName) => string | undefined
  getFileUrl: (
    quarterId: string,
    type: "invoices" | "expenses",
    filename: string
  ) => string
}

const DataContext = createContext<DataContextType | undefined>(undefined)

function getEditingKey(quarterId: string, fileName: LedgerFileName): string {
  return `${quarterId}/${fileName}`
}

function getAttachmentKey(quarterId: string, filename: string): string {
  return `${quarterId}/attachment/${filename}`
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  // Storage state
  const [userStorages, setUserStorages] = useState<Storage[]>([])
  const [activeStorageName, setActiveStorageName] = useState<string>(
    SAMPLE_STORAGE.name
  )

  // Editing state
  const [editingFiles, setEditingFiles] = useState<Map<string, EditingFile>>(
    new Map()
  )
  const [editingAttachments, setEditingAttachments] = useState<
    Map<string, EditingAttachment>
  >(new Map())
  const [isCommitting, setIsCommitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Load storage config from localStorage
  useEffect(() => {
    const config = loadStorageConfig()
    if (config) {
      setUserStorages(config.storages.length > 0 ? config.storages : [])
      setActiveStorageName(config.activeStorageName || SAMPLE_STORAGE.name)
    }
  }, [])

  // Save storage config to localStorage
  useEffect(() => {
    const config: StorageConfig = {
      storages: userStorages,
      activeStorageName,
    }
    saveStorageConfig(config)
  }, [userStorages, activeStorageName])

  // Compute active storage
  const storages = [...userStorages, SAMPLE_STORAGE]
  const userActiveStorage = userStorages.find(
    (storage) => storage.name === activeStorageName
  )
  const activeStorage = userActiveStorage || SAMPLE_STORAGE
  const isSample = !userActiveStorage

  // Load quarters
  const quartersQuery = useQuery({
    queryKey: ["quarters", activeStorage.name],
    queryFn: async () => {
      const repo = new QuartersRepository(activeStorage)
      return await repo.list()
    },
    enabled: !!activeStorage,
  })

  const githubQuarters = quartersQuery.data || []
  const editingQuarters = Array.from(
    new Set(Array.from(editingFiles.values()).map((file) => file.quarterId))
  ).sort()
  const quarters = Array.from(
    new Set([...githubQuarters, ...editingQuarters])
  ).sort()

  // Get company name from first cashflow file we can find
  const firstQuarter = quarters[0]
  const companyNameQuery = useQuery({
    queryKey: ["companyName", activeStorage.name, firstQuarter],
    queryFn: async () => {
      if (!firstQuarter) return null
      const repo = new QuarterFileRepository<CashflowFileData>(
        activeStorage,
        "cashflow"
      )
      const result = await repo.getContent(firstQuarter)
      return result.data?.companyName || null
    },
    enabled: !!activeStorage && !!firstQuarter,
  })

  const companyName = companyNameQuery.data || null

  // Storage management functions
  const setActiveStorageFn = (storageName: string) => {
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

  // Unified data loading function
  const getFile = <T extends LedgerFileName>(
    quarterId: string,
    fileName: T
  ): FileResult<FileDataType<T>> => {
    const editingFile = editingFiles.get(getEditingKey(quarterId, fileName))

    const query = useQuery({
      queryKey: ["loadFile", activeStorage.name, quarterId, fileName],
      queryFn: async () => {
        const repo = new QuarterFileRepository(activeStorage, fileName)
        return await repo.getContent(quarterId)
      },
      enabled: !!activeStorage && !editingFile,
    })

    if (editingFile) {
      return {
        content: editingFile.data as FileDataType<T>,
        isPending: false,
        error: null,
        isEditing: true,
      }
    }

    return {
      content: (query.data?.data ?? null) as FileDataType<T>,
      isPending: query.isPending,
      error:
        query.error || (query.data?.error ? new Error(query.data.error) : null),
      isEditing: false,
    }
  }

  // Editing operations
  const isDirtyFile = (
    quarterId: string,
    fileName: LedgerFileName
  ): boolean => {
    return editingFiles.has(getEditingKey(quarterId, fileName))
  }

  const updateFile = (
    quarterId: string,
    fileName: LedgerFileName,
    data: Invoice[] | Expense[] | CashflowFileData,
    sha?: string
  ) => {
    setEditingFiles((prev) => {
      const newMap = new Map(prev)
      newMap.set(getEditingKey(quarterId, fileName), {
        quarterId,
        fileName,
        data,
        sha,
      })
      return newMap
    })
  }

  const addAttachment = (
    quarterId: string,
    filename: string,
    content: ArrayBuffer
  ) => {
    setEditingAttachments((prev) => {
      const newMap = new Map(prev)
      newMap.set(getAttachmentKey(quarterId, filename), {
        quarterId,
        filename,
        content,
      })
      return newMap
    })
  }

  const getAttachment = (
    quarterId: string,
    filename: string
  ): EditingAttachment | undefined => {
    return editingAttachments.get(getAttachmentKey(quarterId, filename))
  }

  const removeAttachment = (quarterId: string, filename: string) => {
    setEditingAttachments((prev) => {
      const newMap = new Map(prev)
      newMap.delete(getAttachmentKey(quarterId, filename))
      return newMap
    })
  }

  const createNewQuarter = (quarterId: string, companyName: string) => {
    updateFile(quarterId, "invoices", [])
    updateFile(quarterId, "expenses", [])
    updateFile(quarterId, "cashflow", {
      companyName,
      carryOver: 0,
      entries: [],
    })
  }

  const clearAllEditing = () => {
    setEditingFiles(new Map())
    setEditingAttachments(new Map())
  }

  const editingCount = editingFiles.size

  const commitChanges = async (): Promise<void> => {
    setGlobalError(null)
    setIsCommitting(true)

    try {
      const filesToCommit = Array.from(editingFiles.values())
      const attachmentsToCommit = Array.from(editingAttachments.values())

      // Use the GitHubStorageService directly for committing
      const service = new GitHubStorageService(activeStorage.url)

      // Prepare JSON files in the format expected by GitHubStorageService
      const jsonFiles = filesToCommit.map((file) => ({
        quarterId: file.quarterId,
        fileName: file.fileName,
        content: file.data,
        sha: file.sha,
        isBinary: false as const,
      }))

      // Prepare binary attachments
      const binaryFiles = attachmentsToCommit.map((attachment) => {
        const fileType = attachment.filename.endsWith(".pdf")
          ? "expenses"
          : "invoices"
        return {
          quarterId: attachment.quarterId,
          fileName: `${fileType}/${attachment.filename}`,
          content: attachment.content,
          isBinary: true as const,
        }
      })

      // Commit all changes
      await service.commitMultipleFiles(
        jsonFiles,
        binaryFiles,
        "Update ledger files"
      )

      clearAllEditing()
      await queryClient.invalidateQueries()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setIsCommitting(false)
    }
  }

  const getFileShaFn = (
    quarterId: string,
    type: LedgerFileName
  ): string | undefined => {
    const queryKey = ["loadFile", activeStorage.name, quarterId, type]
    const cachedData = queryClient.getQueryData<{
      data: any
      sha?: string
    }>(queryKey)

    return cachedData?.sha
  }

  const getFileUrlFn = (
    quarterId: string,
    type: "invoices" | "expenses",
    filename: string
  ): string => {
    return getFileUrl(activeStorage.url, quarterId, type, filename)
  }

  return (
    <DataContext.Provider
      value={{
        storages,
        activeStorage,
        isSample,
        companyName,
        setActiveStorage: setActiveStorageFn,
        addStorage,
        removeStorage,
        quarters,
        quartersLoading: quartersQuery.isPending,
        quartersError: quartersQuery.error,
        getFile,
        editingFiles,
        editingAttachments,
        editingCount,
        isCommitting,
        globalError,
        isDirtyFile,
        updateFile,
        addAttachment,
        getAttachment,
        removeAttachment,
        createNewQuarter,
        clearAllEditing,
        commitChanges,
        getFileSha: getFileShaFn,
        getFileUrl: getFileUrlFn,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
