import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ClassNameWrapperProps {
  children: ReactNode
  className?: string
  conditionalClasses?: Record<string, boolean>
}

/**
 * A utility component to safely handle dynamic class names
 * This helps avoid PostCSS parsing issues with template literals
 */
export function ClassNameWrapper({ children, className = "", conditionalClasses = {} }: ClassNameWrapperProps) {
  const conditionalClassNames = Object.entries(conditionalClasses)
    .filter(([_, condition]) => condition)
    .map(([className]) => className)
    .join(" ")

  return <div className={cn(className, conditionalClassNames)}>{children}</div>
}
