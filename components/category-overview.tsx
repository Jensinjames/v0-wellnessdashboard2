"use client"

import { useState, useMemo, useId } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useWellness } from "@/context/wellness-context"
import { getCategoryColorClass } from "@/types/wellness"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CategoryCard } from "./category-overview/category-card"
import { ComparisonChart } from "./category-overview/comparison-chart"
import { ComparisonTable } from "./category-overview/comparison-table"
import { GoalComparison } from "./category-overview/goal-comparison"
import { calculateProgress, DEFAULT_MAX_CATEGORIES } from "./category-overview/utils"
import type {
  CategoryOverviewProps,
  ComparisonMetric,
  ComparisonData,
  GoalComparisonData,
} from "./category-overview/types"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useScreenReaderAnnouncer, LiveRegion } from "@/components/accessibility/screen-reader-announcer"

export function CategoryOverview({
  showGoals = false,
  showTimeAllocations = false,
  showSubcategoryProgress = false,
  interactive = false,
  maxCategories = DEFAULT_MAX_CATEGORIES,
  comparisonMode = false,
}: CategoryOverviewProps) {
  const { categories, entries, goals } = useWellness()
  const { isMobile } = useMobileDetection()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>("progress")
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const { announce } = useScreenReaderAnnouncer()

  // Generate unique IDs for components
  const baseId = useId().replace(/:/g, "-")
  const tabsId = `${baseId}-tabs`
  const chartTabId = `${baseId}-chart-tab`
  const tableTabId = `${baseId}-table-tab`
  const goalsTabId = `${baseId}-goals-tab`
  const metricDropdownId = `${baseId}-metric-dropdown`
  const categorySelectorId = `${baseId}-category-selector`

  // Initialize with enabled categories, up to the max limit
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categories
      .filter((c) => c.enabled)
      .slice(0, 5)
      .map((c) => c.id),
  )

  // Get today's date with time set to 00:00:00
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  // Filter entries for today - memoized to avoid recalculation
  const todayEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate.getTime() === today.getTime()
    })
  }, [entries, today])

  // Calculate progress for each category - memoized to avoid recalculation
  const categoryProgress = useMemo(() => {
    return categories
      .filter((category) => category.enabled)
      .slice(0, maxCategories)
      .map((category) => {
        // Get all metrics for this category
        const categoryMetrics = category.metrics

        // Calculate total progress
        let totalProgress = 0
        let totalGoal = 0
        let totalTime = 0
        let totalActivities = 0
        let totalCurrentValue = 0

        const subcategoryProgress = categoryMetrics.map((metric) => {
          // Find goal for this metric
          const goal = goals.find((g) => g.categoryId === category.id && g.metricId === metric.id)
          const goalValue = goal ? goal.value : metric.defaultGoal

          // Find today's entry for this metric
          const metricEntries = todayEntries.flatMap((entry) =>
            entry.metrics.filter((m) => m.categoryId === category.id && m.metricId === metric.id),
          )

          // Sum up all values for this metric today
          const currentValue = metricEntries.reduce((sum, entry) => sum + entry.value, 0)

          // Calculate progress as percentage using the utility function
          const metricProgress = calculateProgress(currentValue, goalValue)

          // Add to totals
          totalGoal += goalValue
          totalProgress += metricProgress
          totalActivities += metricEntries.length
          totalCurrentValue += currentValue

          // Calculate time in hours if the metric is time-based
          if (metric.unit === "minutes") {
            totalTime += currentValue / 60
          } else if (metric.unit === "hours") {
            totalTime += currentValue
          }

          return {
            id: metric.id,
            name: metric.name,
            progress: metricProgress,
            current: currentValue,
            goal: goalValue,
            unit: metric.unit,
          }
        })

        // Average progress across all metrics
        const averageProgress = categoryMetrics.length > 0 ? totalProgress / categoryMetrics.length : 0

        // Calculate efficiency (progress per hour)
        const efficiency = totalTime > 0 ? averageProgress / totalTime : 0

        // Calculate goal achievement (current value as percentage of total goal)
        const goalAchievement = calculateProgress(totalCurrentValue, totalGoal)

        return {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          progress: averageProgress,
          subcategories: subcategoryProgress,
          totalGoal,
          totalTime,
          totalActivities,
          efficiency,
          totalCurrentValue,
          goalAchievement,
        }
      })
  }, [categories, goals, maxCategories, todayEntries])

  // Handle card click
  const handleCardClick = (categoryId: string) => {
    if (interactive) {
      const isExpanding = expandedCategory !== categoryId
      const category = categories.find((c) => c.id === categoryId)

      setExpandedCategory(expandedCategory === categoryId ? null : categoryId)

      // Announce the expansion/collapse to screen readers
      if (category) {
        announce(`${category.name} category ${isExpanding ? "expanded" : "collapsed"}`, "polite")
      }
    }
  }

  // Toggle category selection for comparison
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newSelection = prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]

      // Announce the selection change to screen readers
      const category = categories.find((c) => c.id === categoryId)
      if (category) {
        announce(`${category.name} ${prev.includes(categoryId) ? "removed from" : "added to"} comparison`, "polite")
      }

      return newSelection
    })
  }

  // Memoize filtered categories to avoid recalculation
  const filteredCategories = useMemo(() => {
    return categoryProgress.filter((cat) => selectedCategories.includes(cat.id))
  }, [categoryProgress, selectedCategories])

  // Prepare data for comparison chart - memoized to avoid recalculation
  const getComparisonData = useMemo((): ComparisonData[] => {
    if (filteredCategories.length === 0) return []

    switch (comparisonMetric) {
      case "progress":
        return filteredCategories.map((cat) => {
          const colorClass = getCategoryColorClass({ ...cat, metrics: [] }, "bg")?.replace("bg-", "") || "gray-400"
          const average = filteredCategories.reduce((sum, c) => sum + c.progress, 0) / filteredCategories.length

          return {
            name: cat.name,
            value: Math.round(cat.progress),
            color: colorClass,
            average: Math.round(average),
          }
        })
      case "time":
        return filteredCategories.map((cat) => {
          const colorClass = getCategoryColorClass({ ...cat, metrics: [] }, "bg")?.replace("bg-", "") || "gray-400"
          const average = filteredCategories.reduce((sum, c) => sum + c.totalTime, 0) / filteredCategories.length

          return {
            name: cat.name,
            value: Number(cat.totalTime.toFixed(1)),
            color: colorClass,
            average: Number(average.toFixed(1)),
          }
        })
      case "efficiency":
        return filteredCategories.map((cat) => {
          const colorClass = getCategoryColorClass({ ...cat, metrics: [] }, "bg")?.replace("bg-", "") || "gray-400"
          const efficiencyValue = cat.totalTime > 0 ? cat.progress / cat.totalTime : 0
          const average =
            filteredCategories.reduce((sum, c) => sum + (c.totalTime > 0 ? c.progress / c.totalTime : 0), 0) /
            filteredCategories.length

          return {
            name: cat.name,
            value: Number(efficiencyValue.toFixed(1)),
            color: colorClass,
            average: Number(average.toFixed(1)),
          }
        })
      case "goalAchievement":
        return filteredCategories.map((cat) => {
          const colorClass = getCategoryColorClass({ ...cat, metrics: [] }, "bg")?.replace("bg-", "") || "gray-400"
          const average = filteredCategories.reduce((sum, c) => sum + c.goalAchievement, 0) / filteredCategories.length

          return {
            name: cat.name,
            value: Math.round(cat.goalAchievement),
            goal: 100,
            color: colorClass,
            average: Math.round(average),
          }
        })
      default:
        return []
    }
  }, [filteredCategories, comparisonMetric])

  // Get goal comparison data - memoized to avoid recalculation
  const goalComparisonData = useMemo((): GoalComparisonData[] => {
    return filteredCategories.map((cat) => {
      const colorClass = getCategoryColorClass({ ...cat, metrics: [] }, "bg")?.replace("bg-", "") || "gray-400"
      return {
        name: cat.name,
        current: Math.round(cat.totalCurrentValue),
        goal: cat.totalGoal,
        achievement: Math.round(cat.goalAchievement),
        color: colorClass,
        gap: Math.max(0, cat.totalGoal - cat.totalCurrentValue),
      }
    })
  }, [filteredCategories])

  // Handle metric selection change
  const handleMetricChange = (value: ComparisonMetric) => {
    setComparisonMetric(value)

    // Announce the metric change to screen readers
    const metricLabels = {
      progress: "Progress",
      time: "Time",
      efficiency: "Efficiency",
      goalAchievement: "Goal Achievement",
    }

    announce(`Comparison metric changed to ${metricLabels[value]}`, "polite")
  }

  // Render standard category cards
  const renderCategoryCards = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categoryProgress.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          isExpanded={expandedCategory === category.id}
          showGoals={showGoals}
          showTimeAllocations={showTimeAllocations}
          showSubcategoryProgress={showSubcategoryProgress}
          interactive={interactive}
          onCardClick={handleCardClick}
        />
      ))}
    </div>
  )

  // Render mobile-friendly metric selector
  const renderMobileMetricSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between mb-2"
          id={metricDropdownId}
          aria-label="Select comparison metric"
        >
          Compare by:{" "}
          {comparisonMetric === "progress"
            ? "Progress"
            : comparisonMetric === "time"
              ? "Time"
              : comparisonMetric === "efficiency"
                ? "Efficiency"
                : "Goal Achievement"}
          <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuLabel>Select Metric</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={comparisonMetric}
          onValueChange={(value) => handleMetricChange(value as ComparisonMetric)}
        >
          <DropdownMenuRadioItem value="progress">Progress</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="time">Time</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="efficiency">Efficiency</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="goalAchievement">Goal Achievement</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Render mobile-friendly category selector
  const renderMobileCategorySelector = () => (
    <div className="mb-4">
      <Button
        variant="outline"
        className="w-full justify-between mb-2"
        onClick={() => setShowCategorySelector(!showCategorySelector)}
        id={categorySelectorId}
        aria-expanded={showCategorySelector}
        aria-controls="mobile-category-list"
      >
        Categories ({selectedCategories.length} selected)
        <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
      </Button>

      {showCategorySelector && (
        <Card className="mb-4">
          <CardContent className="p-3">
            <ScrollArea className="h-[200px] pr-3">
              <div
                className="space-y-2 pt-2"
                id="mobile-category-list"
                role="group"
                aria-label="Select categories for comparison"
              >
                {categoryProgress.map((category) => {
                  const colorClass = getCategoryColorClass({ ...category, metrics: [] }, "bg") || "bg-gray-400"
                  const checkboxId = `mobile-category-${category.id}`
                  return (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={checkboxId}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategorySelection(category.id)}
                        aria-label={`${category.name} category ${selectedCategories.includes(category.id) ? "selected" : "unselected"}`}
                      />
                      <Label htmlFor={checkboxId} className="flex items-center gap-1 text-sm cursor-pointer">
                        <div className={cn("w-3 h-3 rounded-sm", colorClass)} aria-hidden="true"></div>
                        {category.name}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Render comparison view
  const renderComparisonView = () => (
    <Card className="w-full">
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <Tabs defaultValue="chart" className="w-full" id={tabsId}>
          {/* Mobile-optimized header */}
          {isMobile ? (
            <div className="space-y-2 mb-4">
              <TabsList className="w-full">
                <TabsTrigger value="chart" className="flex-1" id={`${chartTabId}-mobile`}>
                  Chart
                </TabsTrigger>
                <TabsTrigger value="table" className="flex-1" id={`${tableTabId}-mobile`}>
                  Table
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex-1" id={`${goalsTabId}-mobile`}>
                  Goals
                </TabsTrigger>
              </TabsList>

              {renderMobileMetricSelector()}
              {renderMobileCategorySelector()}
            </div>
          ) : (
            /* Desktop header */
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <TabsList>
                <TabsTrigger value="chart" id={chartTabId}>
                  Chart View
                </TabsTrigger>
                <TabsTrigger value="table" id={tableTabId}>
                  Table View
                </TabsTrigger>
                <TabsTrigger value="goals" id={goalsTabId}>
                  Goal Comparison
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="text-sm font-medium">Compare by:</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={comparisonMetric === "progress" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMetricChange("progress")}
                    className="h-8"
                    aria-pressed={comparisonMetric === "progress"}
                  >
                    Progress
                  </Button>
                  <Button
                    variant={comparisonMetric === "time" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMetricChange("time")}
                    className="h-8"
                    aria-pressed={comparisonMetric === "time"}
                  >
                    Time
                  </Button>
                  <Button
                    variant={comparisonMetric === "efficiency" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMetricChange("efficiency")}
                    className="h-8"
                    aria-pressed={comparisonMetric === "efficiency"}
                  >
                    Efficiency
                  </Button>
                  <Button
                    variant={comparisonMetric === "goalAchievement" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMetricChange("goalAchievement")}
                    className="h-8"
                    aria-pressed={comparisonMetric === "goalAchievement"}
                  >
                    Goal Achievement
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Category selector for desktop */}
          {!isMobile && (
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Select categories for comparison">
              {categoryProgress.map((category) => {
                const colorClass = getCategoryColorClass({ ...category, metrics: [] }, "bg") || "bg-gray-400"
                const checkboxId = `category-${category.id}`
                return (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={checkboxId}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategorySelection(category.id)}
                      aria-label={`${category.name} category ${selectedCategories.includes(category.id) ? "selected" : "unselected"}`}
                    />
                    <Label htmlFor={checkboxId} className="flex items-center gap-1 text-sm cursor-pointer">
                      <div className={cn("w-3 h-3 rounded-sm", colorClass)} aria-hidden="true"></div>
                      {category.name}
                    </Label>
                  </div>
                )
              })}
            </div>
          )}

          <TabsContent value="chart" className="mt-0">
            <LiveRegion priority="polite">
              <ComparisonChart data={getComparisonData} metric={comparisonMetric} />
            </LiveRegion>
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <ComparisonTable categories={categoryProgress} selectedCategories={selectedCategories} />
          </TabsContent>

          <TabsContent value="goals" className="mt-0">
            <GoalComparison data={goalComparisonData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )

  // Return the appropriate view based on the comparisonMode prop
  return comparisonMode ? renderComparisonView() : renderCategoryCards()
}
