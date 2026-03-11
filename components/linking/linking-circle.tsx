"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LinkingCircleProps {
  /** Side controls whether the half-line is drawn after (item) or before (cashflow) the circle */
  side: "item" | "cashflow"
  isLinked: boolean
  /** This circle is the active source of an in-progress link */
  isLinkingSource: boolean
  /** This circle can be clicked to complete an in-progress link */
  isLinkableTarget: boolean
  isDisabled: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  ariaLabel?: string
  title?: string
}

export function LinkingCircle({
  side,
  isLinked,
  isLinkingSource,
  isLinkableTarget,
  isDisabled,
  onClick,
  ariaLabel,
  title,
}: LinkingCircleProps) {
  const isInteractive = !!onClick && !isDisabled
  const showX = isLinked || isLinkingSource

  const circle = (
    <button
      className={cn(
        "h-7 w-7 flex items-center justify-center group transition-colors shrink-0",
        isInteractive ? "cursor-pointer" : "cursor-default"
      )}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={title}
    >
      <div
        className={cn(
          "h-3 w-3 rounded-full border-2 flex items-center justify-center transition-colors",
          isLinked
            ? "border-blue-500 group-hover:border-destructive"
            : isLinkingSource
              ? "border-blue-400"
              : isDisabled
                ? "border-foreground/15 opacity-40"
                : isLinkableTarget
                  ? "border-blue-400 group-hover:border-blue-500"
                  : isInteractive
                    ? "border-foreground/50 group-hover:border-foreground"
                    : "border-foreground/20"
        )}
      >
        {showX && (
          <X className="h-2 w-2 text-current opacity-0 group-hover:opacity-100" />
        )}
      </div>
    </button>
  )

  const halfLine = (
    <div className={cn("flex-1 h-[2px]", isLinked ? "bg-blue-500" : "")} />
  )

  if (side === "item") {
    return (
      <>
        {circle}
        {halfLine}
      </>
    )
  }

  return (
    <>
      {halfLine}
      {circle}
    </>
  )
}
