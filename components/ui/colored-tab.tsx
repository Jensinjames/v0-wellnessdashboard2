import type React from "react"
import { cn } from "@/lib/utils"
import { useIconContext } from "@/context/icon-context"
import { getCategoryColorKey, getCategoryColorClasses } from "@/utils/category-color-utils"

interface ColoredTabProps extends React.HTMLAttributes<HTMLButtonElement> {
  categoryId: string
  isActive?: boolean
  label: string
  color?: string
}

export function ColoredTab({ categoryId, isActive = false, label, color, className, ...props }: ColoredTabProps) {
  const { iconPreferences } = useIconContext()

  // Get icon preferences if available
  const iconPref = iconPreferences[categoryId]

  // Get the color for this category (from preferences or default)
  const categoryColor = iconPref?.color || color || getCategoryColorKey(categoryId)

  // Get category color classes
  const colorClasses = getCategoryColorClasses(categoryId, categoryColor)

  return (
    <button
      type="button"
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-offset-2",
        isActive ? colorClasses.active : colorClasses.inactive,
        className,
      )}
      aria-selected={isActive}
      role="tab"
      {...props}
    >
      {label}
    </button>
  )
}
