"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { CategoryIcon } from "@/components/ui/category-icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { cn } from "@/lib/utils"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"
import type { CategoryProgressData } from "./types"
import { formatTime, formatValue } from "./utils"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { useIconContext } from "@/context/icon-context"
import { getCategoryColorKey, getCategoryColorClasses } from "@/utils/category-color-utils"

interface CategoryCardProps {
  category: CategoryProgressData
  isExpanded: boolean
  showGoals: boolean
  showTimeAllocations: boolean
  showSubcategoryProgress: boolean
  interactive: boolean
  onCardClick: (categoryId: string) => void
}

export function CategoryCard({
  category,
  isExpanded,
  showGoals,
  showTimeAllocations,
  showSubcategoryProgress,
  interactive,
  onCardClick,
}: CategoryCardProps) {
  const { isMobile, isSmallMobile } = useMobileDetection()
  const { iconPreferences } = useIconContext()

  // Get icon preferences if available
  const iconPref = iconPreferences[category.id]

  // Get the color for this category (from preferences or default)
  const categoryColor = iconPref?.color || category.color || getCategoryColorKey(category.id)

  // Get category color classes
  const colorClasses = getCategoryColorClasses(category.id, categoryColor)

  // Determine if subcategories should be shown based on screen size and expanded state
  const shouldShowSubcategories =
    (isExpanded || showSubcategoryProgress) && category.subcategories.length > 0 && (!isSmallMobile || isExpanded)

  // Helper function to safely render trend icons
  const renderTrendIcon = (type: string, className: string) => {
    switch (type) {
      case "up":
        return <ArrowUpIcon className={className} aria-hidden="true" />
      case "down":
        return <ArrowDownIcon className={className} aria-hidden="true" />
      case "minus":
        return <MinusIcon className={className} aria-hidden="true" />
      default:
        return null
    }
  }

  const cardId = `category-card-${category.id}`
  const progressId = `category-progress-${category.id}`

  return (
    <Card
      key={category.id}
      className={cn(
        "overflow-hidden transition-all duration-300 h-full",
        interactive && "cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all",
        isExpanded ? "sm:col-span-2 lg:col-span-2" : "",
        "border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      )}
      onClick={interactive ? () => onCardClick(category.id) : undefined}
      id={cardId}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-expanded={interactive ? isExpanded : undefined}
      aria-labelledby={`category-title-${category.id}`}
    >
      {/* Color-coded header */}
      <CardHeader className={cn("py-2 px-4 flex flex-row items-center justify-between", colorClasses.header)}>
        <div className="flex items-center gap-2">
          <CategoryIcon
            categoryId={category.id}
            icon={(iconPref?.name || category.icon) as any}
            size={iconPref?.size || "sm"}
            label={category.name}
            color={categoryColor}
            background={iconPref?.background}
          />
          <h3
            id={`category-title-${category.id}`}
            className={cn("font-medium truncate", colorClasses.headerText, isSmallMobile ? "text-sm" : "")}
          >
            {category.name}
          </h3>
        </div>
        <div className={cn("text-sm font-medium", colorClasses.headerText, isSmallMobile ? "text-xs" : "")}>
          {Math.round(category.progress)}%
        </div>
      </CardHeader>

      <CardContent className={cn("p-4", isSmallMobile ? "p-3" : "", "h-full flex flex-col")}>
        <Progress
          value={category.progress}
          className="h-2 mb-3 bg-slate-100 dark:bg-slate-800"
          indicatorClassName={colorClasses.progress}
          aria-label={`${category.name} progress: ${Math.round(category.progress)}%`}
          id={progressId}
        />

        <div
          className={cn(
            "flex items-center justify-between text-slate-500 dark:text-slate-400",
            isSmallMobile ? "text-xs" : "text-xs",
          )}
        >
          {showGoals && (
            <div>
              Goal: <span className="font-medium">{category.totalGoal || 0}</span>
            </div>
          )}
          {showTimeAllocations && (
            <div>
              Time: <span className="font-medium">{formatTime(category.totalTime || 0)}</span>
            </div>
          )}
          {!showGoals && !showTimeAllocations && (
            <>
              <div>Daily</div>
              <div>Progress</div>
            </>
          )}
        </div>

        {shouldShowSubcategories && (
          <div className={cn("mt-4 space-y-3 flex-grow", isSmallMobile ? "mt-3 space-y-2" : "")}>
            <VisuallyHidden>Subcategory breakdown</VisuallyHidden>
            {category.subcategories.map((subcategory) => {
              const subcategoryId = `subcategory-${category.id}-${subcategory.id}`
              const subcategoryProgressId = `subcategory-progress-${category.id}-${subcategory.id}`

              return (
                <div key={subcategoryId} className="space-y-1" id={subcategoryId}>
                  <div className={cn("flex items-center justify-between", isSmallMobile ? "text-xs" : "text-xs")}>
                    <div className="truncate max-w-[60%] text-slate-700 dark:text-slate-300">{subcategory.name}</div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {formatValue(subcategory.current, subcategory.unit)} /{" "}
                            {formatValue(subcategory.goal, subcategory.unit)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Current: {formatValue(subcategory.current, subcategory.unit)}</p>
                          <p>Goal: {formatValue(subcategory.goal, subcategory.unit)}</p>
                          <p>Progress: {Math.round(subcategory.progress)}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Progress
                    value={subcategory.progress}
                    className={cn("h-1.5 bg-slate-100 dark:bg-slate-800", isSmallMobile ? "h-1" : "")}
                    indicatorClassName={colorClasses.progress}
                    aria-label={`${subcategory.name} progress: ${Math.round(subcategory.progress)}%`}
                    id={subcategoryProgressId}
                  />
                </div>
              )
            })}
          </div>
        )}

        {interactive && (
          <div className={cn("mt-auto pt-3", isSmallMobile ? "pt-2" : "")}>
            <EnhancedButton
              variant="outline"
              size={isSmallMobile ? "sm" : "sm"}
              className={cn("text-xs w-full rounded-full", isSmallMobile ? "py-1 px-2" : "")}
              onClick={(e) => {
                e.stopPropagation()
                onCardClick(category.id)
              }}
              id={`toggle-details-${category.id}`}
              aria-controls={cardId}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Hide details for ${category.name}` : `Show details for ${category.name}`}
              icon={isExpanded ? "ChevronUp" : "ChevronDown"}
            >
              {isExpanded ? "Show Less" : "Show Details"}
            </EnhancedButton>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
