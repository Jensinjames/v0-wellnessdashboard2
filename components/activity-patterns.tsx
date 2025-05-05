"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export function ActivityPatterns() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"frequency" | "duration" | "value">("frequency")
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "year">("month")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")

  // Get data based on selected filters
  const activityTimeData = getActivityTimeData(timeFrame, selectedCategory, viewMode)
  const categoryData = getCategoryDistribution(timeFrame, viewMode)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Activity Patterns</h2>
          <p className="text-muted-foreground">Analyze your activity patterns and identify trends over time.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
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
          <Select value={timeFrame} onValueChange={(value: "week" | "month" | "year") => setTimeFrame(value)}>
            <SelectTrigger className="w-[140px]">
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
            <div className="flex gap-1">
              <Button
                variant={viewMode === "frequency" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("frequency")}
              >
                Frequency
              </Button>
              <Button
                variant={viewMode === "duration" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("duration")}
              >
                Duration
              </Button>
              <Button
                variant={viewMode === "value" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("value")}
              >
                Value
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                <div className="flex gap-1">
                  {streakData.lastTenDays.map((active, i) => (
                    <div
                      key={i}
                      className={`h-8 w-8 rounded-md flex items-center justify-center text-xs ${
                        active ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
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
            <div className="grid grid-cols-7 gap-1">
              {heatmapData.map((day, i) => (
                <div key={i} className="space-y-1 text-center">
                  {i < 7 && (
                    <div className="text-xs text-muted-foreground">{["S", "M", "T", "W", "T", "F", "S"][i]}</div>
                  )}
                  <div
                    className={`h-8 rounded-sm ${
                      day.value === 0
                        ? "bg-gray-100"
                        : day.value === 1
                          ? "bg-green-100"
                          : day.value === 2
                            ? "bg-green-300"
                            : "bg-green-500"
                    }`}
                    title={`${day.date}: ${day.value} activities`}
                  />
                </div>
              ))}
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
              {correlationData.map((item, i) => (
                <Badge key={i} variant={item.correlation > 0.5 ? "default" : "outline"}>
                  {item.activity}: {item.correlation.toFixed(2)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
