import { Paperclip } from "lucide-react"
import { getFileUrl } from "@/lib/storage-types"
import { useLanguage } from "@/lib/i18n-context"
import { Storage } from "@/lib/storage-types"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AttachmentCellProps {
  storage: Storage
  quarterId: string
  type: "invoices" | "expenses"
  filename?: string
}

export function AttachmentCell({
  storage,
  quarterId,
  type,
  filename,
}: AttachmentCellProps) {
  if (!filename) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={getFileUrl(storage.url, quarterId, type, filename)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
        </a>
      </TooltipTrigger>
      <TooltipContent>{filename}</TooltipContent>
    </Tooltip>
  )
}
