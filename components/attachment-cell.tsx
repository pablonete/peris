import { Paperclip } from "lucide-react"
import { useData } from "@/lib/data"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AttachmentCellProps {
  quarterId: string
  type: "invoices" | "expenses"
  filename?: string
}

export function AttachmentCell({
  quarterId,
  type,
  filename,
}: AttachmentCellProps) {
  const { getFileUrl } = useData()

  if (!filename) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={getFileUrl(quarterId, type, filename)}
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
