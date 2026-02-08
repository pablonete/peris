import { AlertCircle } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface ErrorBannerProps {
  title: string
  message: string
  className?: string
}

export function ErrorBanner({
  title,
  message,
  className = "",
}: ErrorBannerProps) {
  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <AlertCircle className="h-4 w-4 text-red-900" />
      <AlertTitle className="font-mono text-red-900">{title}</AlertTitle>
      <AlertDescription className="font-mono text-xs">
        {message}
      </AlertDescription>
    </Alert>
  )
}
