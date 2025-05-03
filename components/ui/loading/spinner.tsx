import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: "default" | "primary" | "secondary" | "muted"
  className?: string
  label?: string
}

export function Spinner({ size = "md", variant = "primary", className, label = "Loading..." }: SpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3 border-[1.5px]",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
    xl: "h-12 w-12 border-4",
  }

  const variantClasses = {
    default: "border-muted-foreground/30 border-t-muted-foreground/80",
    primary: "border-primary/30 border-t-primary",
    secondary: "border-secondary/30 border-t-secondary",
    muted: "border-muted/30 border-t-muted",
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn("animate-spin rounded-full", sizeClasses[size], variantClasses[variant], className)}
        role="status"
        aria-busy="true"
      >
        <VisuallyHidden>{label}</VisuallyHidden>
      </div>
    </div>
  )
}
