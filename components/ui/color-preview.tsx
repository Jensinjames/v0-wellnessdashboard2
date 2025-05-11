import { cn } from "@/lib/utils"
import { getBaseColor, getColorShade } from "@/utils/category-color-utils"

interface ColorPreviewProps {
  color: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export function ColorPreview({ color, size = "sm", className }: ColorPreviewProps) {
  const baseColor = getBaseColor(color)
  const shade = getColorShade(color)

  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <div className={cn("rounded-full", sizeClasses[size], `bg-${baseColor}-${shade}`, className)} aria-hidden="true" />
  )
}
