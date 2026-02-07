import React from "react"
import type { Metadata } from 'next'
import { Crimson_Text, IBM_Plex_Mono } from 'next/font/google'

import './globals.css'

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-crimson-text',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
})

export const metadata: Metadata = {
  title: 'Ledger Book',
  description: 'Personal accounting ledger',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${crimsonText.variable} ${ibmPlexMono.variable}`}>
      <body className="font-serif antialiased">{children}</body>
    </html>
  )
}
