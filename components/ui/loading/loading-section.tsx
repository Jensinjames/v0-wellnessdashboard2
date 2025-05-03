import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

interface LoadingSectionProps {
  title?: boolean
  subtitle?: boolean
  lines?: number
  className?: string
}

export function LoadingSection({ title = true, subtitle = false, lines = 3, className }: LoadingSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && <Skeleton variant="text" className="h-5 w-1/4" />}
      {subtitle && <Skeleton variant="text" className="h-4 w-1/3" />}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="text" className={i === lines - 1 ? "w-3/4" : "w-full"} />
        ))}
      </div>
    </div>
  )
}
