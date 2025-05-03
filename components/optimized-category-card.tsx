"use client"

import { useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useWellness } from "@/context/wellness-context"
import { useContextSelector } from "@/lib/context-selector"
import { deepMemo } from "@/lib/memo-utils"
import { useRenderMonitor } from "@/lib/performance-utils"

interface OptimizedCategoryCardProps {
  categoryId: string
  onSelect?: (categoryId: string) => void
  showProgress?: boolean
}

// Component implementation with optimizations
function OptimizedCategoryCardComponent({ categoryId, onSelect, showProgress = true }: OptimizedCategoryCardProps) {
  // Monitor renders for debugging
  useRenderMonitor(`OptimizedCategoryCard(${categoryId})`)

  // Use context selector to only get the data we need
  const category = useContextSelector(
    useWellness as any,
    useCallback((state: any) => state.getCategoryById(categoryId), [categoryId]),
  )

  const goals = useContextSelector(
    useWellness as any,
    useCallback(
      (state: any) => {
        return state.goals.filter((g: any) => g.categoryId === categoryId)
      },
      [categoryId],
    ),
  )

  // Memoize derived data
  const progress = useMemo(() => {
    if (!category || !goals.length) return 0

    // Calculate progress (simplified for example)
    return Math.random() * 100
  }, [category, goals])

  // Memoize event handlers
  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(categoryId)
    }
  }, [categoryId, onSelect])

  // Return null if category doesn't exist
  if (!category) return null

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{category.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {showProgress && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-right">{progress.toFixed(0)}%</p>
          </div>
        )}
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">{category.metrics.length} metrics</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Export memoized component
export const OptimizedCategoryCard = deepMemo(OptimizedCategoryCardComponent)
