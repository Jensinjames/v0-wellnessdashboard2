import type React from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { iconSizes } from "@/lib/theme-config"

export interface AccessibleIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: keyof typeof LucideIcons
  label?: string
  size?: keyof typeof iconSizes | string
  className?: string
}

export function AccessibleIcon({ name, label, size = "md", className, ...props }: AccessibleIconProps) {
  const IconComponent = LucideIcons[name] as React.ComponentType<{ className?: string }>

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide icons`)
    return null
  }

  const sizeClass = size in iconSizes ? iconSizes[size as keyof typeof iconSizes] : size

  return (
    <span className={cn("inline-flex", className)} role="img" aria-label={label} {...props}>
      <IconComponent className={cn(sizeClass, "flex-shrink-0")} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
