"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { translations } from "./translations"

type Language = "es" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
)

// Default translations for SSR fallback
const defaultT = (key: string): string => {
  const keys = key.split(".")
  let value: any = translations["es"]
  for (const k of keys) {
    value = value?.[k]
  }
  return value || key
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es")

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language | null
    if (saved) setLanguageState(saved)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations[language]
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    // Return default context for SSR/fallback
    return {
      language: "es" as Language,
      setLanguage: () => {},
      t: defaultT,
    }
  }
  return context
}
