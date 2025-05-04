"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit2, Trash2, ChevronDown, ChevronRight, BarChart2, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from "recharts"
import type { WellnessEntryData, CategoryId, WellnessCategory, WellnessMetric } from "@/types/wellness"

interface EnhancedEntriesTableProps {
  entries: WellnessEntryData[]
  onEdit: (entry: WellnessEntryData) => void
  onDelete: (id: string) => void
  getCategoryScore: (entry: WellnessEntryData, categoryId: CategoryId) => number
  getOverallScore: (entry: WellnessEntryData) => number
  getScoreBadgeColor: (score: number) => string
  getCategoryColorClass: (categoryId: CategoryId) => string
  searchTerm: string
  categories: WellnessCategory[]
}

export function EnhancedEntriesTable({
  entries,
  onEdit,
  onDelete,
  getCategoryScore,
  getOverallScore,
  getScoreBadgeColor,
  getCategoryColorClass,
  searchTerm,
  categories,
}: EnhancedEntriesTableProps) {
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({})
  const [activeView, setActiveView] = useState<"table" | "goals">("table")

  // Get enabled categories for display
  const enabledCategories = categories.filter((c) => c.enabled)

  // Toggle expanded state for an entry
  const toggleExpanded = (entryId: string) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }))
  }

  // Get metric value for an entry
  const getMetricValue = (entry: WellnessEntryData, categoryId: CategoryId, metricId: string): number | null => {
    const metric = entry.metrics.find((m) => m.categoryId === categoryId && m.metricId === metricId)
    return metric ? metric.value : null
  }

  // Get metric definition
  const getMetricDefinition = (categoryId: CategoryId, metricId: string): WellnessMetric | undefined => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.metrics.find((m) => m.id === metricId)
  }

  // Format metric value based on its type
  const formatMetricValue = (value: number, metricDef?: WellnessMetric): string => {
    if (!metricDef) return `${value}`

    switch (metricDef.unit) {
      case "minutes":
        return `${value} min`
      case "hours":
        return `${value} hr`
      case "count":
        return `${value}`
      case "percentage":
        return `${value}%`
      case "rating":
        return `${value}/10`
      default:
        return `${value} ${metricDef.unit}`
    }
  }

  // Calculate goal progress for a metric
  const calculateGoalProgress = (value: number, metricDef?: WellnessMetric): number => {
    if (!metricDef || !metricDef.goal) return 0

    // For stress level, lower is better
    if (metricDef.id === "stressLevel") {
      return Math.min(100, Math.max(0, ((metricDef.max - value) / (metricDef.max - metricDef.min)) * 100))
    }

    return Math.min(100, Math.max(0, (value / metricDef.goal) * 100))
  }

  // Get goal comparison data for charts
  const getGoalComparisonData = (entry: WellnessEntryData) => {
    return enabledCategories.map((category) => {
      const categoryScore = getCategoryScore(entry, category.id)
      const goalScore = 80 // Default goal score, could be customized per category

      // Map category colors to hex values for the chart
      const colorMap: Record<string, string> = {
        green: "#22c55e",
        yellow: "#eab308",
        red: "#ef4444",
        pink: "#ec4899",
        blue: "#3b82f6",
        purple: "#8b5cf6",
        slate: "#64748b",
      }

      const colorHex = colorMap[category.color] || "#64748b"

      return {
        name: category.name,
        current: categoryScore,
        goal: goalScore,
        fill: colorHex,
        gap: Math.max(0, goalScore - categoryScore),
        colorName: category.color,
      }
    })
  }

  // Get color for progress bar based on progress percentage
  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return "bg-green-500"
    if (progress >= 75) return "bg-blue-500"
    if (progress >= 50) return "bg-yellow-500"
    if (progress >= 25) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <div className="w-full">
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "table" | "goals")} className="mb-4">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mx-auto">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Table View</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Goal Comparison</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <TabsContent value="table" className="mt-0">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Overall</TableHead>
                  {enabledCategories.slice(0, 4).map((category) => (
                    <TableHead key={category.id} className="hidden md:table-cell">
                      {category.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length > 0 ? (
                  entries.map((entry) => {
                    const overallScore = getOverallScore(entry)
                    const entryDate = format(new Date(entry.date), "MMM d, yyyy")
                    const entryId = entry.id
                    const isExpanded = expandedEntries[entryId] || false

                    return (
                      <>
                        <TableRow key={entryId} className="group">
                          <TableCell className="p-2 align-middle">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleExpanded(entryId)}
                              className="h-8 w-8 rounded-full p-0"
                              aria-label={isExpanded ? "Collapse entry details" : "Expand entry details"}
                              aria-expanded={isExpanded}
                              aria-controls={`entry-details-${entryId}`}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <VisuallyHidden>
                                {isExpanded ? "Collapse entry details" : "Expand entry details"}
                              </VisuallyHidden>
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{entryDate}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getScoreBadgeColor(overallScore)} shadow-sm text-white`}>
                                {overallScore}%
                              </Badge>
                              <Progress
                                value={overallScore}
                                className="h-2 w-16 md:w-24"
                                indicatorClassName={getProgressColor(overallScore)}
                              />
                            </div>
                          </TableCell>
                          {enabledCategories.slice(0, 4).map((category) => {
                            const categoryScore = getCategoryScore(entry, category.id)
                            return (
                              <TableCell key={category.id} className="hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`${getCategoryColorClass(category.id)} shadow-sm`}
                                  >
                                    {Math.round(categoryScore)}%
                                  </Badge>
                                  <Progress
                                    value={categoryScore}
                                    className="h-2 w-16"
                                    indicatorClassName={`bg-${category.color}-500`}
                                  />
                                </div>
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onEdit(entry)}
                                      className="h-8 w-8 rounded-full"
                                      aria-label={`Edit entry from ${entryDate}`}
                                      id={`edit-entry-${entryId}`}
                                    >
                                      <Edit2 className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit entry</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onDelete(entryId)}
                                      className="h-8 w-8 rounded-full text-red-700 hover:bg-red-50 hover:text-red-600"
                                      aria-label={`Delete entry from ${entryDate}`}
                                      id={`delete-entry-${entryId}`}
                                    >
                                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete entry</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded details row */}
                        <TableRow
                          id={`entry-details-${entryId}`}
                          className={isExpanded ? "" : "hidden"}
                          aria-hidden={!isExpanded}
                        >
                          <TableCell colSpan={6 + enabledCategories.slice(0, 4).length} className="p-0 border-t-0">
                            <Collapsible open={isExpanded}>
                              <CollapsibleContent className="px-4 py-3 bg-muted/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {enabledCategories.map((category) => (
                                    <div key={category.id} className="space-y-2">
                                      <h4 className="text-sm font-medium flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-sm bg-${category.color}`}></div>
                                        {category.name}
                                      </h4>
                                      <div className="space-y-1.5">
                                        {category.metrics.map((metric) => {
                                          const value = getMetricValue(entry, category.id, metric.id)
                                          if (value === null) return null

                                          const progress = calculateGoalProgress(value, metric)
                                          const progressColor = getProgressColor(progress)

                                          return (
                                            <div
                                              key={metric.id}
                                              className="grid grid-cols-[1fr,auto] gap-2 items-center"
                                            >
                                              <div className="text-xs text-muted-foreground">{metric.name}</div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium">
                                                  {formatMetricValue(value, metric)}
                                                </span>
                                                {metric.goal && (
                                                  <TooltipProvider>
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                          <div
                                                            className={progressColor}
                                                            style={{ width: `${progress}%` }}
                                                          ></div>
                                                        </div>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                        {progress >= 100
                                                          ? `Goal achieved! (${formatMetricValue(value, metric)} / ${formatMetricValue(metric.goal, metric)})`
                                                          : `${progress.toFixed(0)}% of goal (${formatMetricValue(value, metric)} / ${formatMetricValue(metric.goal, metric)})`}
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  </TooltipProvider>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      </>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6 + enabledCategories.slice(0, 4).length} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-muted p-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-6 w-6 text-muted-foreground"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 0 009.253 9H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium">No entries found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {searchTerm
                            ? "Try adjusting your search term."
                            : "Add your first wellness entry to get started."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="goals" className="mt-0">
        <Card>
          <CardContent className="p-4">
            {entries.length > 0 ? (
              <div className="space-y-8">
                {entries.slice(0, 3).map((entry) => {
                  const entryDate = format(new Date(entry.date), "MMM d, yyyy")
                  const goalData = getGoalComparisonData(entry)

                  return (
                    <div key={entry.id} className="space-y-4">
                      <h3 className="text-lg font-medium">{entryDate}</h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={goalData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                            <YAxis
                              label={{
                                value: "Score (%)",
                                angle: -90,
                                position: "insideLeft",
                                style: { textAnchor: "middle" },
                              }}
                            />
                            <Bar dataKey="current" name="Current Score">
                              {goalData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                              <LabelList dataKey="current" position="top" />
                            </Bar>
                            <Bar dataKey="goal" name="Goal Score" fill="#8884d8">
                              <LabelList dataKey="goal" position="top" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {goalData.map((item) => (
                          <div key={item.name} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium">{item.name}</h4>
                              <Badge variant={item.current >= item.goal ? "success" : "outline"}>
                                {Math.round((item.current / item.goal) * 100)}%
                              </Badge>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Current: {item.current}%</span>
                              <span>Goal: {item.goal}%</span>
                            </div>
                            <Progress
                              value={(item.current / item.goal) * 100}
                              className="h-2"
                              indicatorClassName={`bg-${item.colorName}-500`}
                            />
                            <div className="text-xs text-center">
                              {item.current < item.goal ? (
                                <span>Need {item.gap}% more to reach goal</span>
                              ) : (
                                <span className="text-green-500">Goal achieved!</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No entries to compare</h3>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Add wellness entries to see goal comparisons.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  )
}
