"use client"

import { useLanguage } from "@/lib/i18n-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteInvoiceAlertProps {
  invoiceId: string | null
  onClose: () => void
  onConfirm: (id: string) => void
}

export function DeleteInvoiceAlert({
  invoiceId,
  onClose,
  onConfirm,
}: DeleteInvoiceAlertProps) {
  const { t } = useLanguage()

  return (
    <AlertDialog open={!!invoiceId} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("invoices.deleteConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("invoices.deleteConfirmDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel>{t("invoices.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => invoiceId && onConfirm(invoiceId)}
            className="bg-red-600 hover:bg-red-700"
          >
            {t("invoices.deleteButton")}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
