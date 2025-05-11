import * as React from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"

interface AccessibleIconProps {
  name: keyof typeof LucideIcons
  label?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  color?: string
}

export function AccessibleIcon({
  name,
  label,
  size = "md",
  className,
  color,
  ...props
}: AccessibleIconProps & Omit<React.SVGProps<SVGSVGElement>, "name" | "type">) {
  // Get the icon component
  const Icon = LucideIcons[name]

  if (!Icon) {
    console.warn(`Icon "${name}" not found in lucide-react`)
    return null
  }

  // Size mapping
  const sizeMap = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  }

  // Color class
  const colorClass = color ? `text-${color}-600 dark:text-${color}-500` : ""

  return (
    <span className="inline-flex items-center justify-center">
      {React.createElement(Icon, {
        className: cn(sizeMap[size], colorClass, className),
        "aria-hidden": "true",
        ...props,
      })}
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
