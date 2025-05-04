import type React from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { iconSizes, iconColors, iconBackgroundColors } from "@/lib/theme-config"
import { useIconContext } from "@/context/icon-context"

export interface CategoryIconProps extends React.HTMLAttributes<HTMLDivElement> {
  categoryId: string
  icon: keyof typeof LucideIcons
  label?: string
  size?: string
  color?: string
  background?: string
  className?: string
}

export function CategoryIcon({
  categoryId,
  icon,
  label,
  size = "md",
  color,
  background,
  className,
  ...props
}: CategoryIconProps) {
  const { iconPreferences } = useIconContext()

  // Get icon preferences if available
  const iconPref = iconPreferences[categoryId]

  // Use preferences if available, otherwise use props
  const finalIcon = (iconPref?.name || icon) as keyof typeof LucideIcons
  const finalSize = iconPref?.size || size
  const finalColor = iconPref?.color || color || "blue"
  const finalBackground = iconPref?.background || background

  // Get the icon component - FIXED: Create the element properly
  const IconComponent = LucideIcons[finalIcon] || LucideIcons.Activity

  // Determine size class
  const sizeClass = finalSize in iconSizes ? iconSizes[finalSize as keyof typeof iconSizes] : iconSizes.md

  // Determine color class
  const colorClass = finalColor in iconColors ? iconColors[finalColor as keyof typeof iconColors] : iconColors.blue

  // Determine background class
  const backgroundClass =
    finalBackground && finalBackground in iconBackgroundColors
      ? iconBackgroundColors[finalBackground as keyof typeof iconBackgroundColors]
      : ""

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md p-1.5",
        backgroundClass || `bg-${finalColor}-600 dark:bg-${finalColor}-500`,
        className,
      )}
      aria-label={label}
      {...props}
    >
      {/* FIXED: Render the icon component as a JSX element */}
      <IconComponent className={cn(sizeClass, backgroundClass ? colorClass : "text-white")} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  )
}
