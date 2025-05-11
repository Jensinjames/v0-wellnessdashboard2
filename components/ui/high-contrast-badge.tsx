import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const highContrastBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-700 text-white hover:bg-green-700/80",
        danger: "border-transparent bg-red-700 text-white hover:bg-red-700/80",
        warning: "border-transparent bg-yellow-700 text-white hover:bg-yellow-700/80",
        info: "border-transparent bg-blue-700 text-white hover:bg-blue-700/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface HighContrastBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof highContrastBadgeVariants> {
  id?: string
}

function HighContrastBadge({ className, variant, id, ...props }: HighContrastBadgeProps) {
  return <div id={id} className={cn(highContrastBadgeVariants({ variant }), className)} {...props} />
}

export { HighContrastBadge, highContrastBadgeVariants }
