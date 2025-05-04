import type * as React from "react"
import { cn } from "@/lib/utils"
import { useIconContext } from "@/context/icon-context"
import { getCategoryColorKey } from "@/utils/category-color-utils"

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
  const getColorClasses = () => {
    const activeClasses = `bg-${categoryColor}-100 dark:bg-${categoryColor}-900 text-${categoryColor}-800 dark:text-${categoryColor}-200 border-b-2 border-${categoryColor}-600 dark:border-${categoryColor}-500`
    const inactiveClasses = `text-slate-600 dark:text-slate-400 hover:text-${categoryColor}-700 hover:dark:text-${categoryColor}-300 hover:bg-${categoryColor}-50 hover:dark:bg-${categoryColor}-950`

    return isActive ? activeClasses : inactiveClasses
  }

  return (
    <button
      type="button"
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-offset-2",
        getColorClasses(),
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
