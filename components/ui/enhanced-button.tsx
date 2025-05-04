import type React from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" | "info"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
  loadingText?: string
  icon?: keyof typeof LucideIcons
  iconPosition?: "left" | "right"
  color?: string
  className?: string
}

export function EnhancedButton({
  children,
  variant = "default",
  size = "default",
  isLoading = false,
  loadingText,
  icon,
  iconPosition = "left",
  color,
  className,
  ...props
}: EnhancedButtonProps) {
  // Get the icon component if specified
  const IconComponent = icon ? LucideIcons[icon] : null

  // Custom color classes based on the color prop
  const getColorClasses = () => {
    if (!color) return ""

    switch (variant) {
      case "default":
        return `bg-${color}-600 hover:bg-${color}-700 text-white dark:bg-${color}-500 dark:hover:bg-${color}-600`
      case "outline":
        return `border-${color}-600 text-${color}-600 hover:bg-${color}-50 dark:border-${color}-500 dark:text-${color}-500 dark:hover:bg-${color}-950`
      case "secondary":
        return `bg-${color}-100 text-${color}-800 hover:bg-${color}-200 dark:bg-${color}-900 dark:text-${color}-200 dark:hover:bg-${color}-800`
      case "ghost":
        return `text-${color}-600 hover:bg-${color}-50 dark:text-${color}-500 dark:hover:bg-${color}-950`
      default:
        return ""
    }
  }

  const colorClasses = getColorClasses()

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isLoading || props.disabled}
      className={cn("relative", colorClasses, className)}
      {...props}
    >
      {isLoading && (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
          {loadingText && <VisuallyHidden>{loadingText}</VisuallyHidden>}
        </>
      )}

      {!isLoading && IconComponent && iconPosition === "left" && (
        <IconComponent className="h-4 w-4 mr-2" aria-hidden="true" />
      )}

      {children}

      {!isLoading && IconComponent && iconPosition === "right" && (
        <IconComponent className="h-4 w-4 ml-2" aria-hidden="true" />
      )}
    </Button>
  )
}
