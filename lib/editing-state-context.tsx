"use client"

import React, { createContext, useContext, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Invoice, Expense } from "./types"
import { CashflowFileData } from "./github-storage"
import { commitEditingFiles } from "./github-data"
import { useStorage } from "./storage-context"

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

interface EditingStateContextType {
  editingFiles: Map<string, EditingFile>
  editingAttachments: Map<string, EditingAttachment>
  editingCount: number
  isCommitting: boolean
  error: string | null
  getEditingFile: (
    quarterId: string,
    fileName: LedgerFileName
  ) => EditingFile | undefined
  setEditingFile: (
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
}

const EditingStateContext = createContext<EditingStateContextType | undefined>(
  undefined
)

function getEditingKey(quarterId: string, fileName: LedgerFileName): string {
  return `${quarterId}/${fileName}`
}

export function EditingStateProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeStorage } = useStorage()
  const queryClient = useQueryClient()
  const [editingFiles, setEditingFiles] = useState<Map<string, EditingFile>>(
    new Map()
  )
  const [editingAttachments, setEditingAttachments] = useState<
    Map<string, EditingAttachment>
  >(new Map())
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getEditingFile = (
    quarterId: string,
    fileName: LedgerFileName
  ): EditingFile | undefined => {
    return editingFiles.get(getEditingKey(quarterId, fileName))
  }

  const setEditingFile = (
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

  const getAttachmentKey = (quarterId: string, filename: string): string => {
    return `${quarterId}/attachment/${filename}`
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
    setEditingFile(quarterId, "invoices", [])
    setEditingFile(quarterId, "expenses", [])
    setEditingFile(quarterId, "cashflow", {
      companyName,
      entries: [],
    })
  }

  const clearAllEditing = () => {
    setEditingFiles(new Map())
    setEditingAttachments(new Map())
  }

  const editingCount = editingFiles.size

  const commitChanges = async (): Promise<void> => {
    setError(null)
    setIsCommitting(true)

    try {
      const filesToCommit = Array.from(editingFiles.values())
      const attachmentsToCommit = Array.from(editingAttachments.values())
      await commitEditingFiles(
        activeStorage,
        filesToCommit,
        attachmentsToCommit
      )
      clearAllEditing()
      await queryClient.invalidateQueries()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsCommitting(false)
      throw err
    }
    setIsCommitting(false)
  }

  return (
    <EditingStateContext.Provider
      value={{
        editingFiles,
        editingAttachments,
        editingCount,
        isCommitting,
        error,
        getEditingFile,
        setEditingFile,
        addAttachment,
        getAttachment,
        removeAttachment,
        createNewQuarter,
        clearAllEditing,
        commitChanges,
      }}
    >
      {children}
    </EditingStateContext.Provider>
  )
}

export function useEditingState() {
  const context = useContext(EditingStateContext)
  if (context === undefined) {
    throw new Error(
      "useEditingState must be used within an EditingStateProvider"
    )
  }
  return context
}
