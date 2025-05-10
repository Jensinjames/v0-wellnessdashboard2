"use client"

import { useState, useEffect, useRef } from "react"
import { useGoalHierarchy } from "@/hooks/use-goal-hierarchy"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Clock, CheckCircle, AlertTriangle, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-mobile"
import type { GoalCategory, GoalSubcategory } from "@/types/goals-hierarchy"

const statusIcons = {
  not_started: <Tag className="h-4 w-4 text-slate-500" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  on_hold: <AlertTriangle className="h-4 w-4 text-amber-500" />,
}

const priorityClasses = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

export function GoalHierarchyVisualization() {
  const { categories, loading } = useGoalHierarchy()
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const hierarchyRef = useRef<HTMLDivElement>(null)

  // Initialize expanded state when categories load
  useEffect(() => {
    if (categories.length > 0 && Object.keys(expandedCategories).length === 0) {
      // On initial load, expand the first category
      const initialExpandedCategories: Record<string, boolean> = {}
      initialExpandedCategories[categories[0].id] = true
      setExpandedCategories(initialExpandedCategories)
      setActiveCategory(categories[0].id)

      // If the first category has subcategories, expand the first one
      if (categories[0].subcategories && categories[0].subcategories.length > 0) {
        const initialExpandedSubcategories: Record<string, boolean> = {}
        initialExpandedSubcategories[categories[0].subcategories[0].id] = true
        setExpandedSubcategories(initialExpandedSubcategories)
        setActiveSubcategory(categories[0].subcategories[0].id)
      }
    }
  }, [categories, expandedCategories])

  // Calculate total progress for a category
  const calculateCategoryProgress = (category: GoalCategory) => {
    let totalGoals = 0
    let totalProgress = 0

    if (category.subcategories) {
      category.subcategories.forEach((subcategory) => {
        if (subcategory.goals) {
          subcategory.goals.forEach((goal) => {
            totalGoals++
            totalProgress += goal.progress
          })
        }
      })
    }

    return totalGoals > 0 ? totalProgress / totalGoals : 0
  }

  // Calculate total progress for a subcategory
  const calculateSubcategoryProgress = (subcategory: GoalSubcategory) => {
    let totalGoals = 0
    let totalProgress = 0

    if (subcategory.goals) {
      subcategory.goals.forEach((goal) => {
        totalGoals++
        totalProgress += goal.progress
      })
    }

    return totalGoals > 0 ? totalProgress / totalGoals : 0
  }

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
    setActiveCategory(categoryId)

    // On mobile, collapse other categories when one is expanded
    if (isMobile) {
      const newExpandedCategories: Record<string, boolean> = {}
      newExpandedCategories[categoryId] = !expandedCategories[categoryId]
      setExpandedCategories(newExpandedCategories)
    }
  }

  // Toggle subcategory expansion
  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories((prev) => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId],
    }))
    setActiveSubcategory(subcategoryId)

    // On mobile, collapse other subcategories when one is expanded
    if (isMobile) {
      const newExpandedSubcategories: Record<string, boolean> = {}
      newExpandedSubcategories[subcategoryId] = !expandedSubcategories[subcategoryId]
      setExpandedSubcategories(newExpandedSubcategories)
    }
  }

  // Format time allocation
  const formatTimeAllocation = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min/day`
    }
    return `${hours} hr/day`
  }

  // Lazy load visualization when it comes into view
  useEffect(() => {
    if (!hierarchyRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // When the component is visible, we could trigger animations or data loading
            // For now, we'll just ensure the component is visible
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 },
    )

    observer.observe(hierarchyRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goal Hierarchy</CardTitle>
          <CardDescription>Loading your wellness goals...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Hierarchy</CardTitle>
        <CardDescription>Visualize your wellness goals and their relationships</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={hierarchyRef} className="space-y-4">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No goals have been created yet.</p>
              <Button className="mt-4" variant="outline" onClick={() => (window.location.href = "/goals-hierarchy")}>
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="rounded-lg border overflow-hidden">
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer",
                      activeCategory === category.id ? "bg-muted" : "",
                    )}
                    style={{ borderLeft: `4px solid ${category.color}` }}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedCategories[category.id] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{category.name}</span>
                      {category.daily_time_allocation > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {formatTimeAllocation(category.daily_time_allocation)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${calculateCategoryProgress(category)}%`,
                            backgroundColor: category.color,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(calculateCategoryProgress(category))}%
                      </span>
                    </div>
                  </div>

                  {expandedCategories[category.id] && (
                    <div className="pl-6 pr-3 pb-3">
                      {category.subcategories && category.subcategories.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {category.subcategories.map((subcategory) => (
                            <div key={subcategory.id} className="rounded-md border overflow-hidden">
                              <div
                                className={cn(
                                  "flex items-center justify-between p-2 cursor-pointer",
                                  activeSubcategory === subcategory.id ? "bg-muted/50" : "",
                                )}
                                onClick={() => toggleSubcategory(subcategory.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedSubcategories[subcategory.id] ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className="text-sm font-medium">{subcategory.name}</span>
                                  {subcategory.daily_time_allocation > 0 && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                      {formatTimeAllocation(subcategory.daily_time_allocation)}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full"
                                      style={{
                                        width: `${calculateSubcategoryProgress(subcategory)}%`,
                                        backgroundColor: category.color + "cc", // slightly transparent
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(calculateSubcategoryProgress(subcategory))}%
                                  </span>
                                </div>
                              </div>

                              {expandedSubcategories[subcategory.id] && subcategory.goals && (
                                <div className="pl-5 pr-2 pb-2">
                                  {subcategory.goals.length > 0 ? (
                                    <div className="space-y-1.5 mt-1.5">
                                      {subcategory.goals.map((goal) => (
                                        <div key={goal.id} className="rounded border p-2 text-sm">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                              {statusIcons[goal.status as keyof typeof statusIcons]}
                                              <span>{goal.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              {goal.priority && (
                                                <Badge
                                                  className={cn(
                                                    "text-xs",
                                                    priorityClasses[goal.priority as keyof typeof priorityClasses],
                                                  )}
                                                >
                                                  {goal.priority}
                                                </Badge>
                                              )}
                                              {goal.due_date && (
                                                <span className="text-xs text-muted-foreground">
                                                  Due: {new Date(goal.due_date).toLocaleDateString()}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="mt-1.5">
                                            <Progress value={goal.progress} className="h-1.5" />
                                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                              <span>{goal.progress}% complete</span>
                                              {goal.daily_time_allocation > 0 && (
                                                <span>{formatTimeAllocation(goal.daily_time_allocation)}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground py-2">
                                      No goals in this subcategory
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">No subcategories in this category</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
