interface EditingIndicatorProps {
  isEditing: boolean
}

export function EditingIndicator({ isEditing }: EditingIndicatorProps) {
  if (!isEditing) return null

  return (
    <span
      className="h-2 w-2 rounded-full bg-[hsl(var(--ledger-blue))]"
      aria-label="Editing"
    />
  )
}
