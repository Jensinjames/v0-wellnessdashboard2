"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWellness } from "@/context/wellness-context"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronUp, ChevronDown, Minus } from "lucide-react"
import { useUniqueId } from "@/utils/unique-id"
import { LiveRegion, useScreenReaderAnnouncer } from "@/components/accessibility/screen-reader-announcer"
import { safeCn, conditionalCn } from "@/utils/safe-class-names"

type ComparisonPeriod = "current" | "week" | "month" | "quarter"

export function CategoryDetails() {
  const [activeTab, setActiveTab] = useState("faith")
  const [highlightedMetric, setHighlightedMetric] = useState<string | null>(null)
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>("current")
  const { categories, entries } = useWellness()
  const { announce } = useScreenReaderAnnouncer()

  // Generate unique IDs
  const tabsId = useUniqueId("category-tabs")
  const selectId = useUniqueId("comparison-select")
  const chartId = useUniqueId("category-chart")
  const legendId = useUniqueId("chart-legend")

  // Get enabled categories
  const enabledCategories = categories.filter((cat) => cat.enabled)

  // Generate gradient IDs for each category
  const getCategoryGradientId = (categoryId: string, index: number) => `${categoryId}Gradient${index}`

  // Generate data for visualization with comparison
  const getCategoryData = (categoryId: string, period: ComparisonPeriod = "current") => {
    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) return []

    return category.metrics.map((metric, index) => {
      // Generate current value (in a real app, this would come from actual data)
      const currentValue = Math.random() * 100

      // Generate previous value based on period (in a real app, this would come from historical data)
      let previousValue: number
      let changePercent: number

      switch (period) {
        case "week":
          previousValue = currentValue * (0.7 + Math.random() * 0.6) // 70-130% of current
          break
        case "month":
          previousValue = currentValue * (0.6 + Math.random() * 0.8) // 60-140% of current
          break
        case "quarter":
          previousValue = currentValue * (0.5 + Math.random() * 1.0) // 50-150% of current
          break
        default:
          previousValue = currentValue
      }

      // Calculate change percentage
      changePercent = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0

      return {
        name: metric.name,
        value: currentValue,
        previousValue: period === "current" ? null : previousValue,
        changePercent: period === "current" ? null : changePercent,
        goal: metric.defaultGoal,
        id: metric.id,
        color: getMetricColor(categoryId, index),
      }
    })
  }

  // Get color based on category and index
  const getMetricColor = (categoryId: string, index: number) => {
    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) return "#000000"

    const baseColors: Record<string, string> = {
      faith: "#16a34a", // Darkened green for better contrast
      life: "#ca8a04", // Darkened yellow for better contrast
      work: "#dc2626", // Darkened red for better contrast
      health: "#be185d", // Darkened pink for better contrast
      mindfulness: "#2563eb", // Darkened blue for better contrast
      learning: "#7e22ce", // Darkened purple for better contrast
      relationships: "#ea580c", // Darkened orange for better contrast
    }

    const baseColor = baseColors[categoryId] || "#64748b"

    // Adjust shade based on index
    const shadeAdjustment = index * 15
    return adjustColorShade(baseColor, shadeAdjustment)
  }

  // Helper function to adjust color shade
  const adjustColorShade = (hex: string, percent: number) => {
    const num = Number.parseInt(hex.slice(1), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = ((num >> 8) & 0x00ff) + amt
    const B = (num & 0x0000ff) + amt

    return `#${((1 << 24) | ((R < 255 ? (R < 0 ? 0 : R) : 255) << 16) | ((G < 255 ? (G < 0 ? 0 : G) : 255) << 8) | (B < 255 ? (B < 0 ? 0 : B) : 255)).toString(16).slice(1)}`
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background p-3 rounded-md shadow-md border border-border text-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-muted-foreground">Current: {data.value.toFixed(1)}</p>
          {data.previousValue !== null && (
            <p className="text-muted-foreground">
              Previous: {data.previousValue.toFixed(1)}
              <span
                className={safeCn(
                  "ml-2",
                  conditionalCn({
                    condition: data.changePercent > 0,
                    true: "text-green-700",
                    false: conditionalCn({
                      condition: data.changePercent < 0,
                      true: "text-red-700",
                      false: "text-muted-foreground",
                    }),
                  }),
                )}
              >
                {data.changePercent > 0 ? "+" : ""}
                {data.changePercent.toFixed(1)}%
              </span>
            </p>
          )}
          <p className="text-muted-foreground">Goal: {data.goal}</p>
          <p className="font-medium mt-1">Progress: {Math.min(100, (data.value / data.goal) * 100).toFixed(0)}%</p>
        </div>
      )
    }
    return null
  }

  // Get comparison period label
  const getComparisonLabel = (period: ComparisonPeriod): string => {
    switch (period) {
      case "week":
        return "vs Previous Week"
      case "month":
        return "vs Previous Month"
      case "quarter":
        return "vs Previous Quarter"
      default:
        return "Current Period"
    }
  }

  // Render change indicator
  const renderChangeIndicator = (changePercent: number | null) => {
    if (changePercent === null) return null

    if (changePercent > 0) {
      return <ChevronUp className="h-3 w-3 text-green-700" aria-hidden="true" />
    } else if (changePercent < 0) {
      return <ChevronDown className="h-3 w-3 text-red-700" aria-hidden="true" />
    } else {
      return <Minus className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const category = categories.find((cat) => cat.id === value)
    if (category) {
      announce(`Viewing ${category.name} category metrics`, "polite")
    }
  }

  // Handle comparison period change
  const handleComparisonChange = (value: ComparisonPeriod) => {
    setComparisonPeriod(value)
    announce(`Changed comparison period to ${getComparisonLabel(value)}`, "polite")
  }

  // Handle metric highlight
  const handleMetricHighlight = (metricId: string | null) => {
    setHighlightedMetric(metricId)
    if (metricId) {
      const category = categories.find((cat) => cat.id === activeTab)
      const metric = category?.metrics.find((m) => m.id === metricId)
      if (metric) {
        announce(`Highlighting ${metric.name} metric`, "polite")
      }
    } else {
      announce("Showing all metrics", "polite")
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Category Performance</CardTitle>
        <Select
          value={comparisonPeriod}
          onValueChange={(value) => handleComparisonChange(value as ComparisonPeriod)}
          id={selectId}
        >
          <SelectTrigger className="h-8 w-[180px]" aria-label="Select comparison period">
            <SelectValue placeholder="Select comparison period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Period</SelectItem>
            <SelectItem value="week">vs Previous Week</SelectItem>
            <SelectItem value="month">vs Previous Month</SelectItem>
            <SelectItem value="quarter">vs Previous Quarter</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" id={tabsId}>
          <div className="border-b px-4">
            <TabsList className="w-full justify-start rounded-none border-b-0 p-0">
              {enabledCategories.slice(0, 4).map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  id={`category-tab-${category.id}`}
                  aria-controls={`category-content-${category.id}`}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {enabledCategories.slice(0, 4).map((category) => (
            <TabsContent key={category.id} value={category.id} className="p-4" id={`category-content-${category.id}`}>
              <LiveRegion>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        <span
                          className="inline-block h-2 w-2 rounded-full bg-foreground/70 mr-1"
                          aria-hidden="true"
                        ></span>
                        Inner ring: Current values
                        <span
                          className="inline-block h-2 w-2 rounded-full bg-foreground/30 mx-1 ml-3"
                          aria-hidden="true"
                        ></span>
                        Outer ring: Goals
                      </p>
                      {comparisonPeriod !== "current" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full bg-foreground/50 mr-1 border border-background"
                            aria-hidden="true"
                          ></span>
                          Middle ring: {getComparisonLabel(comparisonPeriod).replace("vs ", "")}
                        </p>
                      )}
                    </div>
                    {/* SVG Definitions for gradients */}
                    <svg width="0" height="0" className="absolute" aria-hidden="true">
                      <defs>
                        {getCategoryData(category.id, comparisonPeriod).map((item, index) => (
                          <linearGradient
                            key={`gradient-${item.id}`}
                            id={getCategoryGradientId(category.id, index)}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor={item.color} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={adjustColorShade(item.color, 20)} stopOpacity={1} />
                          </linearGradient>
                        ))}
                      </defs>
                    </svg>

                    {/* Composite Donut Chart */}
                    <div
                      className="h-64 w-64"
                      role="img"
                      aria-label={`${category.name} metrics visualization with ${getComparisonLabel(comparisonPeriod)}`}
                      id={chartId}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip content={<CustomTooltip />} />

                          {/* Current values ring */}
                          <Pie
                            data={getCategoryData(category.id, comparisonPeriod)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            startAngle={90}
                            endAngle={-270}
                          >
                            {getCategoryData(category.id, comparisonPeriod).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={`url(#${getCategoryGradientId(category.id, index)})`}
                                stroke="var(--background)"
                                strokeWidth={highlightedMetric === entry.id ? 3 : 2}
                                opacity={highlightedMetric === null || highlightedMetric === entry.id ? 1 : 0.4}
                              />
                            ))}
                          </Pie>

                          {/* Previous period ring (only shown when comparison is active) */}
                          {comparisonPeriod !== "current" && (
                            <Pie
                              data={getCategoryData(category.id, comparisonPeriod)}
                              dataKey="previousValue"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={55}
                              paddingAngle={2}
                              startAngle={90}
                              endAngle={-270}
                            >
                              {getCategoryData(category.id, comparisonPeriod).map((entry, index) => (
                                <Cell
                                  key={`prev-cell-${index}`}
                                  fill={entry.color}
                                  stroke="var(--background)"
                                  strokeWidth={1}
                                  opacity={highlightedMetric === null || highlightedMetric === entry.id ? 0.6 : 0.2}
                                />
                              ))}
                            </Pie>
                          )}

                          {/* Goal ring */}
                          <Pie
                            data={getCategoryData(category.id, comparisonPeriod)}
                            dataKey="goal"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={85}
                            outerRadius={90}
                            paddingAngle={2}
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                          >
                            {getCategoryData(category.id, comparisonPeriod).map((entry, index) => (
                              <Cell
                                key={`goal-cell-${index}`}
                                fill={adjustColorShade(entry.color, 40)}
                                opacity={highlightedMetric === null || highlightedMetric === entry.id ? 0.3 : 0.1}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <VisuallyHidden>
                      <ul>
                        {getCategoryData(category.id, comparisonPeriod).map((item) => (
                          <li key={item.id}>
                            {item.name}: Current value {item.value.toFixed(1)},
                            {item.previousValue !== null && ` Previous value ${item.previousValue.toFixed(1)},`}
                            Goal {item.goal}
                          </li>
                        ))}
                      </ul>
                    </VisuallyHidden>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Chart legend" id={legendId}>
                    {getCategoryData(category.id, comparisonPeriod).map((metric, index) => (
                      <button
                        key={`legend-${metric.id}`}
                        className={safeCn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                          conditionalCn({
                            condition: highlightedMetric === metric.id,
                            true: "bg-muted ring-1 ring-ring",
                            false: "hover:bg-muted/50",
                          }),
                        )}
                        onClick={() => handleMetricHighlight(highlightedMetric === metric.id ? null : metric.id)}
                        aria-pressed={highlightedMetric === metric.id}
                        aria-label={`Highlight ${metric.name} metric`}
                        id={`legend-item-${metric.id}`}
                      >
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{
                            background: `linear-gradient(135deg, ${metric.color} 0%, ${adjustColorShade(metric.color, 20)} 100%)`,
                          }}
                          aria-hidden="true"
                        />
                        <span
                          className={safeCn(
                            "text-xs",
                            conditionalCn({
                              condition: highlightedMetric === metric.id,
                              true: "font-medium",
                              false: "text-muted-foreground",
                            }),
                          )}
                        >
                          {metric.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {getCategoryData(category.id, comparisonPeriod).map((metric) => (
                    <div
                      key={metric.id}
                      className={safeCn(
                        "space-y-2 p-2 rounded-md transition-colors",
                        conditionalCn({
                          condition: highlightedMetric === metric.id,
                          true: "bg-muted/50",
                          false: "",
                        }),
                      )}
                      id={`metric-detail-${metric.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={safeCn(
                            "text-sm",
                            conditionalCn({
                              condition: highlightedMetric === metric.id,
                              true: "font-semibold",
                              false: "font-medium",
                            }),
                          )}
                        >
                          {metric.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {comparisonPeriod !== "current" && renderChangeIndicator(metric.changePercent)}
                          <span className="text-sm font-medium">
                            {metric.value.toFixed(1)}/{metric.goal}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full transition-all duration-500 ease-in-out"
                          style={{
                            width: `${Math.min(100, (metric.value / metric.goal) * 100)}%`,
                            background: `linear-gradient(90deg, ${metric.color} 0%, ${adjustColorShade(metric.color, 20)} 100%)`,
                            opacity: highlightedMetric === null || highlightedMetric === metric.id ? 1 : 0.5,
                          }}
                          aria-hidden="true"
                        ></div>
                      </div>

                      {/* Comparison bar (only shown when comparison is active) */}
                      {comparisonPeriod !== "current" && metric.previousValue !== null && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            Previous: {metric.previousValue.toFixed(1)}
                          </span>
                          <span
                            className={safeCn(
                              "text-xs",
                              conditionalCn({
                                condition: metric.changePercent > 0,
                                true: "text-green-700",
                                false: conditionalCn({
                                  condition: metric.changePercent < 0,
                                  true: "text-red-700",
                                  false: "text-muted-foreground",
                                }),
                              }),
                            )}
                          >
                            {metric.changePercent > 0 ? "+" : ""}
                            {metric.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </LiveRegion>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
