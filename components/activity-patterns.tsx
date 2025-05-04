"use client"

import { useState, useId } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { HighContrastBadge } from "@/components/ui/high-contrast-badge"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  getActivityTimeData,
  getCategoryDistribution,
  getTimeOfDayDistribution,
  getStreakData,
  getHeatmapData,
  getActivityCorrelationData,
} from "@/utils/activity-chart-utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { LiveRegion, useScreenReaderAnnouncer } from "@/components/accessibility/screen-reader-announcer"
import { generateUniqueId } from "@/utils/accessibility-utils"

export function ActivityPatterns() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"frequency" | "duration" | "value">("frequency")
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "year">("month")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")
  const { announce } = useScreenReaderAnnouncer()

  // Generate unique IDs
  const baseId = useId().replace(/:/g, "-")
  const categorySelectId = `${baseId}-category-select`
  const timeFrameSelectId = `${baseId}-timeframe-select`
  const viewModeButtonsId = `${baseId}-viewmode-buttons`

  // Get data based on selected filters
  const activityTimeData = getActivityTimeData(timeFrame, selectedCategory, viewMode)
  const categoryData = getCategoryDistribution(timeFrame, selectedCategory)
  const timeOfDayData = getTimeOfDayDistribution(timeFrame, selectedCategory)
  const streakData = getStreakData(selectedCategory)
  const heatmapData = getHeatmapData(timeFrame, selectedCategory)
  const correlationData = getActivityCorrelationData(selectedCategory)

  // Format value based on view mode
  const formatValue = (value: number) => {
    if (viewMode === "duration") {
      const hours = Math.floor(value / 60)
      const minutes = value % 60
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    } else if (viewMode === "value") {
      return value.toFixed(1)
    }
    return value.toString()
  }

  // Get label based on view mode
  const getYAxisLabel = () => {
    if (viewMode === "frequency") return "Frequency"
    if (viewMode === "duration") return "Duration (min)"
    return "Value"
  }

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    announce(`Category changed to ${value === "all" ? "All Categories" : value}`, "polite")
  }

  // Handle time frame change
  const handleTimeFrameChange = (value: "week" | "month" | "year") => {
    setTimeFrame(value)
    const timeFrameLabels = { week: "This Week", month: "This Month", year: "This Year" }
    announce(`Time frame changed to ${timeFrameLabels[value]}`, "polite")
  }

  // Handle view mode change
  const handleViewModeChange = (mode: "frequency" | "duration" | "value") => {
    setViewMode(mode)
    announce(`View mode changed to ${mode}`, "polite")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Activity Patterns</h2>
          <p className="text-muted-foreground">Analyze your activity patterns and identify trends over time.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[140px]" id={categorySelectId} aria-label="Select category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="exercise">Exercise</SelectItem>
              <SelectItem value="meditation">Meditation</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="sleep">Sleep</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFrame} onValueChange={(value: "week" | "month" | "year") => handleTimeFrameChange(value)}>
            <SelectTrigger className="w-[140px]" id={timeFrameSelectId} aria-label="Select time frame">
              <SelectValue placeholder="Time Frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Activity Trends</CardTitle>
              <CardDescription>
                {viewMode === "frequency" && "Number of activities over time"}
                {viewMode === "duration" && "Duration of activities over time"}
                {viewMode === "value" && "Value of activities over time"}
              </CardDescription>
            </div>
            <div className="flex gap-1" role="group" aria-labelledby={viewModeButtonsId}>
              <span id={viewModeButtonsId} className="sr-only">
                View mode options
              </span>
              <Button
                variant={viewMode === "frequency" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange("frequency")}
                aria-pressed={viewMode === "frequency"}
              >
                Frequency
              </Button>
              <Button
                variant={viewMode === "duration" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange("duration")}
                aria-pressed={viewMode === "duration"}
              >
                Duration
              </Button>
              <Button
                variant={viewMode === "value" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange("value")}
                aria-pressed={viewMode === "value"}
              >
                Value
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <LiveRegion>
              <ChartContainer
                config={{
                  activity: {
                    label: "Activity",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="aspect-[4/2] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis
                      label={{ value: getYAxisLabel(), angle: -90, position: "insideLeft" }}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-activity)"
                      fill="var(--color-activity)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </LiveRegion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>
              {viewMode === "frequency" && "Activity frequency by category"}
              {viewMode === "duration" && "Time spent by category"}
              {viewMode === "value" && "Value distribution by category"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[4/3] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatValue(value as number), "Value"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time of Day</CardTitle>
            <CardDescription>When you're most active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[4/3] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDayData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip formatter={(value) => [formatValue(value as number), "Activities"]} />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Streaks</CardTitle>
            <CardDescription>Your consistency over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{streakData.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{streakData.longestStreak}</div>
                  <div className="text-xs text-muted-foreground">Longest Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{streakData.totalDays}</div>
                  <div className="text-xs text-muted-foreground">Total Active Days</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Last 10 Days</div>
                <div className="flex gap-1" role="group" aria-label="Activity streak for last 10 days">
                  {streakData.lastTenDays.map((active, i) => {
                    const dayId = generateUniqueId(`streak-day-${i + 1}`)
                    return (
                      <div
                        key={i}
                        id={dayId}
                        className={`h-8 w-8 rounded-md flex items-center justify-center text-xs ${
                          active
                            ? "bg-green-700 text-white"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                        aria-label={`Day ${i + 1}: ${active ? "Active" : "Inactive"}`}
                      >
                        {i + 1}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity Heatmap</CardTitle>
            <CardDescription>Your activity intensity throughout the period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1" role="table" aria-label="Activity heatmap">
              <div className="sr-only" role="row">
                <span role="columnheader">Sunday</span>
                <span role="columnheader">Monday</span>
                <span role="columnheader">Tuesday</span>
                <span role="columnheader">Wednesday</span>
                <span role="columnheader">Thursday</span>
                <span role="columnheader">Friday</span>
                <span role="columnheader">Saturday</span>
              </div>
              {heatmapData.map((day, i) => {
                const dayId = generateUniqueId(`heatmap-day-${i}`)
                const dayOfWeek = i % 7
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                const intensityLabels = ["No activity", "Low activity", "Medium activity", "High activity"]
                const intensity = day.value

                return (
                  <div key={i} className="space-y-1 text-center" role="cell">
                    {i < 7 && (
                      <div className="text-xs text-muted-foreground">{["S", "M", "T", "W", "T", "F", "S"][i]}</div>
                    )}
                    <div
                      id={dayId}
                      className={`h-8 rounded-sm ${
                        day.value === 0
                          ? "bg-gray-100 dark:bg-gray-800"
                          : day.value === 1
                            ? "bg-green-200 dark:bg-green-900"
                            : day.value === 2
                              ? "bg-green-500 dark:bg-green-700"
                              : "bg-green-700 dark:bg-green-500"
                      }`}
                      title={`${day.date}: ${day.value} activities`}
                      aria-label={`${dayNames[dayOfWeek]}, ${day.date}: ${intensityLabels[intensity]}`}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Activity Correlations</CardTitle>
            <CardDescription>How different activities relate to each other</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {correlationData.map((item, i) => {
                const badgeId = generateUniqueId(`correlation-${i}`)
                // Use high contrast badges for better accessibility
                return (
                  <HighContrastBadge
                    key={i}
                    id={badgeId}
                    variant={item.correlation > 0.5 ? "success" : "outline"}
                    aria-label={`${item.activity} correlation: ${item.correlation.toFixed(2)}`}
                  >
                    {item.activity}: {item.correlation.toFixed(2)}
                  </HighContrastBadge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
