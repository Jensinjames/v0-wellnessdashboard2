"use client"

import { cn } from "@/lib/utils"
import { getCategoryColorClass } from "@/types/wellness"
import type { CategoryProgressData } from "./types"
import { getTrendIndicator, calculateAverage } from "./utils"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown } from "lucide-react"

interface ComparisonTableProps {
  categories: CategoryProgressData[]
  selectedCategories: string[]
}

export function ComparisonTable({ categories, selectedCategories }: ComparisonTableProps) {
  const { isMobile } = useMobileDetection()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const filteredCategories = categories.filter((cat) => selectedCategories.includes(cat.id))

  // If no categories are selected, show a message
  if (filteredCategories.length === 0) {
    return <div className="p-4 text-center">No categories selected for comparison</div>
  }

  // Calculate averages once
  const avgProgress = calculateAverage(filteredCategories, "progress")
  const avgTime = calculateAverage(filteredCategories, "totalTime")
  const avgActivities = calculateAverage(filteredCategories, "totalActivities")
  const avgEfficiency = calculateAverage(
    filteredCategories.map((cat) => ({
      ...cat,
      calculatedEfficiency: cat.totalTime > 0 ? cat.progress / cat.totalTime : 0,
    })),
    "calculatedEfficiency",
  )
  const avgGoalAchievement = calculateAverage(filteredCategories, "goalAchievement")

  // For mobile, render a card-based layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const colorClass = getCategoryColorClass({ ...category, metrics: [] }, "text") || "text-gray-600"
          const bgColorClass = getCategoryColorClass({ ...category, metrics: [] }, "bg") || "bg-gray-400"
          const trendIndicator = getTrendIndicator(category.totalCurrentValue, category.totalGoal)
          const efficiency = category.totalTime > 0 ? category.progress / category.totalTime : 0
          const isExpanded = expandedCategory === category.id

          return (
            <div key={category.id} className="border rounded-lg overflow-hidden bg-card">
              <div
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-sm", bgColorClass)}></div>
                  <span className={cn("font-medium", colorClass)}>{category.name}</span>
                </div>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </Button>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Progress</span>
                      <span className="font-medium">{Math.round(category.progress)}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Time</span>
                      <span className="font-medium">{category.totalTime.toFixed(1)}h</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Activities</span>
                      <span className="font-medium">{category.totalActivities}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Efficiency</span>
                      <span className="font-medium">{efficiency.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-muted-foreground text-xs">Goal Achievement</span>
                      <div className="flex items-center gap-1">
                        {trendIndicator.icon}
                        <span className={trendIndicator.color}>{Math.round(category.goalAchievement)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Average card */}
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <div className="p-3">
            <div className="font-medium">Average</div>
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Progress</span>
                <span className="font-medium">{Math.round(avgProgress)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Time</span>
                <span className="font-medium">{avgTime.toFixed(1)}h</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Activities</span>
                <span className="font-medium">{Math.round(avgActivities)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Efficiency</span>
                <span className="font-medium">{avgEfficiency.toFixed(1)}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-muted-foreground text-xs">Goal Achievement</span>
                <span className="font-medium">{Math.round(avgGoalAchievement)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // For desktop, render the original table
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 border-b">Category</th>
            <th className="text-right p-2 border-b">Progress (%)</th>
            <th className="text-right p-2 border-b">Time (hours)</th>
            <th className="text-right p-2 border-b">Activities</th>
            <th className="text-right p-2 border-b">Efficiency</th>
            <th className="text-right p-2 border-b">Goal Achievement</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map((category) => {
            const colorClass = getCategoryColorClass({ ...category, metrics: [] }, "text") || "text-gray-600"
            const bgColorClass = getCategoryColorClass({ ...category, metrics: [] }, "bg") || "bg-gray-400"
            const trendIndicator = getTrendIndicator(category.totalCurrentValue, category.totalGoal)
            const efficiency = category.totalTime > 0 ? category.progress / category.totalTime : 0

            return (
              <tr key={category.id} className="hover:bg-muted/50">
                <td className="p-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-sm", bgColorClass)}></div>
                    <span className={colorClass}>{category.name}</span>
                  </div>
                </td>
                <td className="text-right p-2 border-b">{Math.round(category.progress)}%</td>
                <td className="text-right p-2 border-b">{category.totalTime.toFixed(1)}</td>
                <td className="text-right p-2 border-b">{category.totalActivities}</td>
                <td className="text-right p-2 border-b">{efficiency.toFixed(1)}</td>
                <td className="text-right p-2 border-b">
                  <div className="flex items-center justify-end gap-1">
                    {trendIndicator.icon}
                    <span className={trendIndicator.color}>{Math.round(category.goalAchievement)}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
          <tr className="bg-muted/30 font-medium">
            <td className="p-2 border-b">Average</td>
            <td className="text-right p-2 border-b">{Math.round(avgProgress)}%</td>
            <td className="text-right p-2 border-b">{avgTime.toFixed(1)}</td>
            <td className="text-right p-2 border-b">{Math.round(avgActivities)}</td>
            <td className="text-right p-2 border-b">{avgEfficiency.toFixed(1)}</td>
            <td className="text-right p-2 border-b">{Math.round(avgGoalAchievement)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
