import type { Metadata } from "next"
import WelcomePageContent from "./content"

export const metadata: Metadata = {
  title: "Peris",
  description:
    "A minimalist ledger book application for personal financial tracking",
}

export default function WelcomePage() {
  return <WelcomePageContent />
}
