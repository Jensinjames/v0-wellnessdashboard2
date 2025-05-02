"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getCategoryColorClass } from "@/types/wellness"
import type { CategoryProgressData } from "./types"
import { formatTime, formatValue } from "./utils"

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
  // Get icon component by name
  const getIconByName = (name: string): LucideIcon => {
    return (Icons[name as keyof typeof Icons] as LucideIcon) || Icons.Activity
  }

  const Icon = getIconByName(category.icon)
  const colorClass = getCategoryColorClass({ ...category, metrics: [] }, "text")
  const bgColorClass = getCategoryColorClass({ ...category, metrics: [] }, "bg")

  // Safely handle color classes
  const safeColorClass = colorClass || "text-gray-600"
  const safeBgColorClass = bgColorClass || "bg-gray-100"
  const lightBgColorClass = safeBgColorClass.replace("600", "100")

  return (
    <Card
      key={category.id}
      className={cn(
        "overflow-hidden transition-all duration-300",
        interactive && "cursor-pointer hover:shadow-md",
        isExpanded && "sm:col-span-2 lg:col-span-2",
      )}
      onClick={interactive ? () => onCardClick(category.id) : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", lightBgColorClass)}>
              <Icon className={cn("h-4 w-4", safeColorClass)} />
            </div>
            <h3 className="font-medium">{category.name}</h3>
          </div>
          <div className="text-sm font-medium">{Math.round(category.progress)}%</div>
        </div>

        <Progress
          value={category.progress}
          className="h-2 mb-3"
          indicatorClassName={safeBgColorClass}
          aria-label={`${category.name} progress: ${Math.round(category.progress)}%`}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {showGoals && (
            <div>
              Goal: <span className="font-medium">{category.totalGoal}</span>
            </div>
          )}
          {showTimeAllocations && (
            <div>
              Time: <span className="font-medium">{formatTime(category.totalTime)}</span>
            </div>
          )}
          {!showGoals && !showTimeAllocations && (
            <>
              <div>Daily</div>
              <div>Progress</div>
            </>
          )}
        </div>

        {(isExpanded || showSubcategoryProgress) && category.subcategories.length > 0 && (
          <div className="mt-4 space-y-3">
            <VisuallyHidden>Subcategory breakdown</VisuallyHidden>
            {category.subcategories.map((subcategory) => (
              <div key={subcategory.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div>{subcategory.name}</div>
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
                  className="h-1.5"
                  indicatorClassName={safeBgColorClass}
                  aria-label={`${subcategory.name} progress: ${Math.round(subcategory.progress)}%`}
                />
              </div>
            ))}
          </div>
        )}

        {interactive && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs w-full"
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
