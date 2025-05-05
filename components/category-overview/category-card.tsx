"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getCategoryColorClass } from "@/types/wellness"
import type { CategoryProgressData } from "./types"
import { formatTime, formatValue } from "./utils"
import { useMobileDetection } from "@/hooks/use-mobile-detection"

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

  // Get icon component by name
  const getIconByName = (name: string): LucideIcon => {
    return (Icons[name as keyof typeof Icons] as LucideIcon) || Icons.Activity
  }

  const Icon = getIconByName(category.icon)
  const colorClass = getCategoryColorClass({ ...category, metrics: [] }, "text")
  const bgColorClass = getCategoryColorClass({ ...category, metrics: [] }, "bg")

  // Safely handle color classes
  const safeColorClass = colorClass || "text-gray-600 dark:text-gray-400"
  const safeBgColorClass = bgColorClass || "bg-gray-100 dark:bg-gray-800"
  const lightBgColorClass = safeBgColorClass.replace(/600|500/g, "100").replace(/800/g, "700")

  // Determine if subcategories should be shown based on screen size and expanded state
  const shouldShowSubcategories =
    (isExpanded || showSubcategoryProgress) && category.subcategories.length > 0 && (!isSmallMobile || isExpanded)

  // Helper function to safely render trend icons
  const renderTrendIcon = (type: string, className: string) => {
    switch (type) {
      case "up":
        return <ArrowUpIcon className={className} />
      case "down":
        return <ArrowDownIcon className={className} />
      case "minus":
        return <MinusIcon className={className} />
      default:
        return null
    }
  }

  return (
    <Card
      key={category.id}
      className={cn(
        "overflow-hidden transition-all duration-300 h-full",
        interactive && "cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all",
        isExpanded ? "sm:col-span-2 lg:col-span-2" : "",
        "border rounded-xl",
        category.name.toLowerCase().includes("health") && "card-shadow-green",
        category.name.toLowerCase().includes("mind") && "card-shadow-purple",
        category.name.toLowerCase().includes("life") && "card-shadow-orange",
        category.name.toLowerCase().includes("faith") && "card-shadow-blue",
      )}
      onClick={interactive ? () => onCardClick(category.id) : undefined}
    >
      <CardContent className={cn("p-4", isSmallMobile ? "p-3" : "", "h-full flex flex-col")}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", safeBgColorClass)}>
              <Icon className={cn("h-4 w-4", "text-white")} aria-hidden="true" />
            </div>
            <h3 className={cn("font-medium truncate", isSmallMobile ? "text-sm" : "")}>{category.name}</h3>
          </div>
          <div className={cn("text-sm font-medium", isSmallMobile ? "text-xs" : "")}>
            {Math.round(category.progress)}%
          </div>
        </div>

        <Progress
          value={category.progress}
          className="h-2 mb-3 bg-gray-100"
          indicatorClassName={safeBgColorClass}
          aria-label={`${category.name} progress: ${Math.round(category.progress)}%`}
        />

        <div
          className={cn(
            "flex items-center justify-between text-muted-foreground",
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
            {category.subcategories.map((subcategory) => (
              <div key={subcategory.id} className="space-y-1">
                <div className={cn("flex items-center justify-between", isSmallMobile ? "text-xs" : "text-xs")}>
                  <div className="truncate max-w-[60%]">{subcategory.name}</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-medium">
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
                  className={cn("h-1.5 bg-gray-100", isSmallMobile ? "h-1" : "")}
                  indicatorClassName={safeBgColorClass}
                  aria-label={`${subcategory.name} progress: ${Math.round(subcategory.progress)}%`}
                />
              </div>
            ))}
          </div>
        )}

        {interactive && (
          <div className={cn("mt-auto pt-3", isSmallMobile ? "pt-2" : "")}>
            <Button
              variant="outline"
              size={isSmallMobile ? "sm" : "sm"}
              className={cn("text-xs w-full rounded-full", isSmallMobile ? "py-1 px-2" : "")}
              onClick={(e) => {
                e.stopPropagation()
                onCardClick(category.id)
              }}
            >
              {isExpanded ? "Show Less" : "Show Details"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
