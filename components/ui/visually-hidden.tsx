import type React from "react"
import { cn } from "@/lib/utils"

interface VisuallyHiddenProps {
  children: React.ReactNode
  className?: string
}

export function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "!-top-px !-left-px",
        className,
      )}
      style={{ clip: "rect(0, 0, 0, 0)" }}
    >
      {children}
    </span>
  )
}
