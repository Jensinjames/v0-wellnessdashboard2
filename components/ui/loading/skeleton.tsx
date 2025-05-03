import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  variant?: "default" | "card" | "text" | "avatar" | "button" | "input"
  animate?: boolean
}

export function Skeleton({ className, variant = "default", animate = true }: SkeletonProps) {
  const baseClasses = "bg-muted rounded"
  const animationClasses = animate ? "animate-pulse" : ""

  const variantClasses = {
    default: "h-4 w-full",
    card: "h-[180px] w-full",
    text: "h-4 w-3/4",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24 rounded-md",
    input: "h-10 w-full rounded-md",
  }

  return <div className={cn(baseClasses, animationClasses, variantClasses[variant], className)} aria-hidden="true" />
}
