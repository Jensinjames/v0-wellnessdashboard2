import type * as React from "react"
import { cn } from "@/lib/utils"

interface LightModeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  elevation?: "low" | "medium" | "high"
}

export function LightModeCard({ children, className, elevation = "medium", ...props }: LightModeCardProps) {
  const elevationClasses = {
    low: "shadow-sm",
    medium: "shadow-md",
    high: "shadow-lg",
  }

  return (
    <div
      className={cn("rounded-lg bg-white border border-slate-200", elevationClasses[elevation], "p-6", className)}
      {...props}
    >
      {children}
    </div>
  )
}
