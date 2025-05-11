"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CategoryIcon } from "@/components/ui/category-icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { CategoryProgressData } from "./types"
import { formatTime, formatValue } from "./utils"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { useIconContext } from "@/context/icon-context"
import { getCategoryColorKey } from "@/utils/category-color-utils"
import {
  getBaseColor,
  getColorShade,
  getHeaderBackgroundClasses,
  getHeaderTextClasses,
  getProgressClasses,
} from "@/utils/category-color-utils"
import { safeCn, conditionalCn } from "@/utils/safe-class-names"

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
  const baseColor = getBaseColor(categoryColor)
  const shade = getColorShade(categoryColor)

  // Determine if subcategories should be shown based on screen size and expanded state
  const shouldShowSubcategories =
    (isExpanded || showSubcategoryProgress) && category.subcategories.length > 0 && (!isSmallMobile || isExpanded)

  const cardId = `category-card-${category.id}`
  const progressId = `category-progress-${category.id}`

  // Get color classes using our utility functions and the new safe class names utility
  const headerBgClass = safeCn(getHeaderBackgroundClasses(category.id, categoryColor))
  const headerTextClass = safeCn(getHeaderTextClasses(category.id, categoryColor))
  const progressBarClass = safeCn(getProgressClasses(category.id, categoryColor))

  return (
    <Card
      key={category.id}
      className={safeCn(
        "overflow-hidden transition-all duration-300 h-full",
        conditionalCn("", {
          "cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all": interactive,
          "sm:col-span-2 lg:col-span-2": isExpanded,
        }),
        "border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
      )}
      onClick={interactive ? () => onCardClick(category.id) : undefined}
      id={cardId}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-expanded={interactive ? isExpanded : undefined}
      aria-labelledby={`category-title-${category.id}`}
    >
      {/* Color-coded header - using utility functions for classes */}
      <CardHeader className={safeCn("py-2 px-4 flex flex-row items-center justify-between", headerBgClass)}>
        <div className="flex items-center gap-2">
          <CategoryIcon
            categoryId={category.id}
            icon={(iconPref?.name || category.icon) as any}
            size={
              ["xs", "sm", "md", "lg"].includes(iconPref?.size as string)
                ? (iconPref?.size as "xs" | "sm" | "md" | "lg")
                : "sm"
            }
            label={category.name}
            color={baseColor}
            shade={shade}
            background={iconPref?.background}
          />
          <h3
            id={`category-title-${category.id}`}
            className={safeCn("font-medium truncate", headerTextClass, conditionalCn("", { "text-sm": isSmallMobile }))}
          >
            {category.name}
          </h3>
        </div>
        <div
          className={safeCn("text-sm font-medium", headerTextClass, conditionalCn("", { "text-xs": isSmallMobile }))}
        >
          {Math.round(category.progress)}%
        </div>
      </CardHeader>

      <CardContent className={safeCn("p-4", conditionalCn("", { "p-3": isSmallMobile }), "h-full flex flex-col")}>
        <Progress
          value={category.progress}
          className="h-2 mb-3 bg-slate-100 dark:bg-slate-800"
          indicatorClassName={progressBarClass}
          aria-label={`${category.name} progress: ${Math.round(category.progress)}%`}
          id={progressId}
        />

        <div
          className={safeCn(
            "flex items-center justify-between text-slate-500 dark:text-slate-400",
            conditionalCn("text-xs", { "text-xs": isSmallMobile }),
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
          <div className={safeCn("mt-4 space-y-3 flex-grow", conditionalCn("", { "mt-3 space-y-2": isSmallMobile }))}>
            <VisuallyHidden>Subcategory breakdown</VisuallyHidden>
            {category.subcategories.map((subcategory) => {
              const subcategoryId = `subcategory-${category.id}-${subcategory.id}`
              const subcategoryProgressId = `subcategory-progress-${category.id}-${subcategory.id}`

              return (
                <div key={subcategoryId} className="space-y-1" id={subcategoryId}>
                  <div
                    className={safeCn(
                      "flex items-center justify-between",
                      conditionalCn("text-xs", { "text-xs": isSmallMobile }),
                    )}
                  >
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
                    className={safeCn(
                      "h-1.5 bg-slate-100 dark:bg-slate-800",
                      conditionalCn("", { "h-1": isSmallMobile }),
                    )}
                    indicatorClassName={progressBarClass}
                    aria-label={`${subcategory.name} progress: ${Math.round(subcategory.progress)}%`}
                    id={subcategoryProgressId}
                  />
                </div>
              )
            })}
          </div>
        )}

        {interactive && (
          <div className={safeCn("mt-auto pt-3", conditionalCn("", { "pt-2": isSmallMobile }))}>
            <Button
              variant="outline"
              size={isSmallMobile ? "sm" : "sm"}
              className={safeCn("text-xs w-full rounded-full", conditionalCn("", { "py-1 px-2": isSmallMobile }))}
              onClick={(e) => {
                e.stopPropagation()
                onCardClick(category.id)
              }}
              id={`toggle-details-${category.id}`}
              aria-controls={cardId}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Hide details for ${category.name}` : `Show details for ${category.name}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  <span>Show Less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  <span>Show Details</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
