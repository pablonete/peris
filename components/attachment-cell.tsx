import { Paperclip } from "lucide-react"
import { getFileUrl } from "@/lib/storage-types"
import { useLanguage } from "@/lib/i18n-context"
import { Storage } from "@/lib/storage-types"

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
  const { t } = useLanguage()

  if (!filename) return null

  return (
    <a
      href={getFileUrl(storage.url, quarterId, type, filename)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
      title={t("common.viewAttachment")}
    >
      <Paperclip className="h-4 w-4" />
    </a>
  )
}
