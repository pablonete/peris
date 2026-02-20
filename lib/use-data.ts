"use client"

import { useStorage } from "@/lib/storage-context"
import { useEditingState } from "@/lib/editing-state-context"
import { useStorageQuarters } from "@/lib/use-storage-quarters"
import { usePerisConfig } from "@/lib/use-peris-config"
import { Invoice, Expense, CashflowEntry } from "@/lib/types"

type LedgerFileName = "invoices" | "expenses" | "cashflow"

type FileContent<T extends LedgerFileName> = T extends "invoices"
  ? Invoice[]
  : T extends "expenses"
    ? Expense[]
    : CashflowEntry[]

export function useData() {
  const {
    activeStorage,
    storages,
    isSample,
    setActiveStorage,
    addStorage,
    removeStorage,
  } = useStorage()
  const {
    getEditingFile,
    setEditingFile,
    addAttachment,
    getAttachment,
    removeAttachment,
    createNewQuarter,
    clearAllEditing,
    commitChanges,
    editingCount,
    isCommitting,
    error: commitError,
  } = useEditingState()
  const {
    quarters,
    isPending: quartersPending,
    error: quartersError,
  } = useStorageQuarters()
  const { config, categories } = usePerisConfig()

  const companyName = config?.companyName ?? ""

  const isDirtyFile = (quarterId: string, type: LedgerFileName): boolean => {
    return !!getEditingFile(quarterId, type)
  }

  const updateFile = <T extends LedgerFileName>(
    quarterId: string,
    type: T,
    data: FileContent<T>,
    sha?: string
  ): void => {
    setEditingFile(quarterId, type, data, sha)
  }

  const getFileUrl = (
    quarterId: string,
    type: LedgerFileName,
    filename: string
  ): string => {
    if (!activeStorage) return ""
    const [owner, repo] = activeStorage.url
      .replace("https://github.com/", "")
      .split("/")
    return `https://raw.githubusercontent.com/${owner}/${repo}/main/${quarterId}/${type}/${filename}`
  }

  return {
    // Storage
    activeStorage,
    storages,
    isSample,
    setActiveStorage,
    addStorage,
    removeStorage,
    companyName,
    categories,

    // Quarters
    quarters,
    quartersPending,
    quartersError,

    // File operations
    isDirtyFile,
    updateFile,
    getFileUrl,

    // Editing state
    editingCount,
    isCommitting,
    commitError,
    commitChanges,
    clearAllEditing,
    createNewQuarter,

    // Attachments
    addAttachment,
    getAttachment,
    removeAttachment,

    // Internal access (for gradual migration - these will be used directly)
    getEditingFile,
    setEditingFile,
  }
}
