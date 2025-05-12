import * as React from "react"

import { cn } from "@/lib/utils"

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn("sr-only", className)} {...props}>
        {children}
      </span>
    )
  },
)
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
