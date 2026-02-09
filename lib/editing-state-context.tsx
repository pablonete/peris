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
}

interface EditingStateContextType {
  editingFiles: Map<string, EditingFile>
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
    data: Invoice[] | Expense[] | CashflowFileData
  ) => void
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
    data: Invoice[] | Expense[] | CashflowFileData
  ) => {
    setEditingFiles((prev) => {
      const newMap = new Map(prev)
      newMap.set(getEditingKey(quarterId, fileName), {
        quarterId,
        fileName,
        data,
      })
      return newMap
    })
  }

  const createNewQuarter = (quarterId: string, companyName: string) => {
    setEditingFile(quarterId, "invoices", [])
    setEditingFile(quarterId, "expenses", [])
    setEditingFile(quarterId, "cashflow", {
      companyName,
      carryOver: 0,
      entries: [],
    })
  }

  const clearAllEditing = () => {
    setEditingFiles(new Map())
  }

  const editingCount = editingFiles.size

  const commitChanges = async (): Promise<void> => {
    setError(null)
    setIsCommitting(true)

    try {
      const filesToCommit = Array.from(editingFiles.values())
      await commitEditingFiles(activeStorage, filesToCommit)
      clearAllEditing()
      await queryClient.invalidateQueries()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <EditingStateContext.Provider
      value={{
        editingFiles,
        editingCount,
        isCommitting,
        error,
        getEditingFile,
        setEditingFile,
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
      "useEditingState must be used within a EditingStateProvider"
    )
  }
  return context
}
