"use client"

import React, { createContext, useContext, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  commitEditingFiles,
  EditingBinaryFile,
  EditingTextFile,
} from "./github-data"
import { useStorage } from "./storage-context"
import { CashflowEntry, Expense, Invoice, PerisConfig } from "./types"

type LedgerFileName = "invoices" | "expenses" | "cashflow"
type LedgerFileData = Invoice[] | Expense[] | CashflowEntry[]
type EditingJsonContent = LedgerFileData | PerisConfig

interface EditingFile {
  quarterId: string
  fileName: LedgerFileName
  data: LedgerFileData
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
  editingConfig: { data: PerisConfig; sha?: string } | null
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
    data: LedgerFileData,
    sha?: string
  ) => void
  setEditingConfig: (data: PerisConfig, sha?: string) => void
  getEditingTextFile: (path: string) => EditingTextFile | undefined
  setEditingTextFile: (
    path: string,
    content: EditingTextFile["content"],
    sha?: string,
    contentType?: "json" | "text"
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
  createNewQuarter: (quarterId: string) => void
  clearAllEditing: () => void
  commitChanges: () => Promise<void>
}

const EditingStateContext = createContext<EditingStateContextType | undefined>(
  undefined
)

export function EditingStateProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeStorage } = useStorage()
  const queryClient = useQueryClient()
  const [editingTextFiles, setEditingTextFiles] = useState<
    Map<string, EditingTextFile>
  >(new Map())
  const [editingBinaryFiles, setEditingBinaryFiles] = useState<
    Map<string, EditingBinaryFile>
  >(new Map())
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getEditingTextFile = (path: string): EditingTextFile | undefined => {
    return editingTextFiles.get(path)
  }

  const setEditingTextFile = (
    path: string,
    content: EditingTextFile["content"],
    sha?: string,
    contentType: "json" | "text" = "json"
  ) => {
    setEditingTextFiles((prev) => {
      const next = new Map(prev)
      next.set(path, { path, content, sha, contentType })
      return next
    })
  }

  const getEditingBinaryFile = (
    path: string
  ): EditingBinaryFile | undefined => {
    return editingBinaryFiles.get(path)
  }

  const setEditingBinaryFile = (path: string, content: ArrayBuffer) => {
    setEditingBinaryFiles((prev) => {
      const next = new Map(prev)
      next.set(path, { path, content })
      return next
    })
  }

  const getEditingFile = (
    quarterId: string,
    fileName: LedgerFileName
  ): EditingFile | undefined => {
    const entry = getEditingTextFile(getLedgerFilePath(quarterId, fileName))
    if (
      !entry ||
      entry.contentType === "text" ||
      !Array.isArray(entry.content)
    ) {
      return undefined
    }

    return {
      quarterId,
      fileName,
      data: entry.content as LedgerFileData,
      sha: entry.sha,
    }
  }

  const setEditingFile = (
    quarterId: string,
    fileName: LedgerFileName,
    data: LedgerFileData,
    sha?: string
  ) => {
    setEditingTextFile(getLedgerFilePath(quarterId, fileName), data, sha)
  }

  const configEntry = getEditingTextFile("peris.json")
  const editingConfig =
    configEntry &&
    configEntry.contentType !== "text" &&
    !Array.isArray(configEntry.content)
      ? {
          data: configEntry.content as PerisConfig,
          sha: configEntry.sha,
        }
      : null

  const setEditingConfig = (data: PerisConfig, sha?: string) => {
    setEditingTextFile("peris.json", data, sha)
  }

  const addAttachment = (
    quarterId: string,
    filename: string,
    content: ArrayBuffer
  ) => {
    setEditingBinaryFile(getAttachmentPath(quarterId, filename), content)
  }

  const getAttachment = (
    quarterId: string,
    filename: string
  ): EditingAttachment | undefined => {
    const attachment = getEditingBinaryFile(
      getAttachmentPath(quarterId, filename)
    )
    if (!attachment) return undefined

    return {
      quarterId,
      filename,
      content: attachment.content,
    }
  }

  const removeAttachment = (quarterId: string, filename: string) => {
    setEditingBinaryFiles((prev) => {
      const next = new Map(prev)
      next.delete(getAttachmentPath(quarterId, filename))
      return next
    })
  }

  const createNewQuarter = (quarterId: string) => {
    setEditingFile(quarterId, "invoices", [])
    setEditingFile(quarterId, "expenses", [])
    setEditingFile(quarterId, "cashflow", [])
  }

  const clearAllEditing = () => {
    setEditingTextFiles(new Map())
    setEditingBinaryFiles(new Map())
  }

  const editingFiles = new Map(
    Array.from(editingTextFiles.values()).flatMap((entry) => {
      const ledgerInfo = parseLedgerFilePath(entry.path)
      if (
        !ledgerInfo ||
        entry.contentType === "text" ||
        !Array.isArray(entry.content)
      ) {
        return []
      }

      return [
        [
          `${ledgerInfo.quarterId}/${ledgerInfo.fileName}`,
          {
            quarterId: ledgerInfo.quarterId,
            fileName: ledgerInfo.fileName,
            data: entry.content as LedgerFileData,
            sha: entry.sha,
          },
        ] as const,
      ]
    })
  )

  const editingAttachments = new Map(
    Array.from(editingBinaryFiles.values()).flatMap((entry) => {
      const attachmentInfo = parseAttachmentPath(entry.path)
      if (!attachmentInfo) {
        return []
      }

      return [
        [
          `${attachmentInfo.quarterId}/attachment/${attachmentInfo.filename}`,
          {
            quarterId: attachmentInfo.quarterId,
            filename: attachmentInfo.filename,
            content: entry.content,
          },
        ] as const,
      ]
    })
  )

  const editingCount = editingTextFiles.size

  const commitChanges = async (): Promise<void> => {
    setError(null)
    setIsCommitting(true)

    try {
      await commitEditingFiles(
        activeStorage,
        Array.from(editingTextFiles.values()),
        Array.from(editingBinaryFiles.values())
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
        editingConfig,
        editingCount,
        isCommitting,
        error,
        getEditingFile,
        setEditingFile,
        setEditingConfig,
        getEditingTextFile,
        setEditingTextFile,
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

function getLedgerFilePath(
  quarterId: string,
  fileName: LedgerFileName
): string {
  return `${quarterId}/${fileName}.json`
}

function getAttachmentPath(quarterId: string, filename: string): string {
  return `${quarterId}/expenses/${filename}`
}

function parseLedgerFilePath(
  path: string
): { quarterId: string; fileName: LedgerFileName } | null {
  const match = path.match(/^([^/]+)\/(invoices|expenses|cashflow)\.json$/)
  if (!match) return null

  return {
    quarterId: match[1],
    fileName: match[2] as LedgerFileName,
  }
}

function parseAttachmentPath(
  path: string
): { quarterId: string; filename: string } | null {
  const match = path.match(/^([^/]+)\/expenses\/(.+)$/)
  if (!match) return null

  return {
    quarterId: match[1],
    filename: match[2],
  }
}
