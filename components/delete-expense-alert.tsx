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

interface DeleteExpenseAlertProps {
  expenseId: string | null
  onClose: () => void
  onConfirm: (id: string) => void
}

export function DeleteExpenseAlert({
  expenseId,
  onClose,
  onConfirm,
}: DeleteExpenseAlertProps) {
  const { t } = useLanguage()

  return (
    <AlertDialog open={!!expenseId} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("expenses.deleteConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("expenses.deleteConfirmDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel>{t("expenses.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => expenseId && onConfirm(expenseId)}
            className="bg-red-600 hover:bg-red-700"
          >
            {t("expenses.deleteButton")}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
