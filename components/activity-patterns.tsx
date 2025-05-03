"use client"

import { useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ZAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  getActivityTimeData,
  getCategoryDistribution,
  getTimeOfDayDistribution,
  getStreakData,
  getCorrelationData,
  type Activity,
} from "@/utils/activity-chart-utils"
import { Clock, BarChart2, PieChartIcon, TrendingUp, ActivityIcon } from "lucide-react"

interface ActivityPatternsProps {
  activities: Activity[]
}

export function ActivityPatterns({ activities }: ActivityPatternsProps) {
  const [timeFrame, setTimeFrame] = useState<"daily" | "weekly" | "monthly">("daily")
  const [chartType, setChartType] = useState<"frequency" | "duration" | "value">("frequency")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")

  // Filter activities based on selected category
  const filteredActivities = useMemo(() => {
    if (categoryFilter === "all") return activities
    return activities.filter((activity) => activity.categoryId === categoryFilter)
  }, [activities, categoryFilter])

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    activities.forEach((activity) => {
      uniqueCategories.add(activity.categoryName)
    })
    return Array.from(uniqueCategories)
  }, [activities])

  // Get data for time-based chart
  const timeData = useMemo(() => getActivityTimeData(filteredActivities, timeFrame), [filteredActivities, timeFrame])

  // Get data for category distribution
  const categoryData = useMemo(() => getCategoryDistribution(filteredActivities), [filteredActivities])

  // Get data for time of day distribution
  const timeOfDayData = useMemo(() => getTimeOfDayDistribution(filteredActivities), [filteredActivities])

  // Get streak data
  const { currentStreak, longestStreak } = useMemo(() => getStreakData(filteredActivities), [filteredActivities])

  // Get correlation data
  const correlationData = useMemo(() => getCorrelationData(filteredActivities), [filteredActivities])

  // Generate colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  // Get the appropriate data key based on chart type
  const getDataKey = () => {
    switch (chartType) {
      case "frequency":
        return "count"
      case "duration":
        return "totalDuration"
      case "value":
        return "avgValue"
      default:
        return "count"
    }
  }

  // Get the appropriate label based on chart type
  const getYAxisLabel = () => {
    switch (chartType) {
      case "frequency":
        return "Number of Activities"
      case "duration":
        return "Total Duration (minutes)"
      case "value":
        return "Average Value"
      default:
        return "Count"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Activity Patterns</h2>

        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Trends Chart */}
        <Card className="col-span-2 border shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activity Trends
              </CardTitle>
              <CardDescription>Track your activity patterns over time</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
              <div className="flex gap-1">
                <Button
                  variant={timeFrame === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame("daily")}
                  aria-pressed={timeFrame === "daily"}
                >
                  Daily
                </Button>
                <Button
                  variant={timeFrame === "weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame("weekly")}
                  aria-pressed={timeFrame === "weekly"}
                >
                  Weekly
                </Button>
                <Button
                  variant={timeFrame === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame("monthly")}
                  aria-pressed={timeFrame === "monthly"}
                >
                  Monthly
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={chartType === "frequency" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("frequency")}
                  aria-pressed={chartType === "frequency"}
                >
                  Frequency
                </Button>
                <Button
                  variant={chartType === "duration" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("duration")}
                  aria-pressed={chartType === "duration"}
                >
                  Duration
                </Button>
                <Button
                  variant={chartType === "value" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("value")}
                  aria-pressed={chartType === "value"}
                >
                  Value
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Accessible description for screen readers */}
            <VisuallyHidden>
              <div id="trend-chart-description">
                {`${timeFrame} activity ${chartType} chart showing your patterns over time.`}
              </div>
            </VisuallyHidden>

            <div aria-labelledby="trend-chart-description" role="figure" tabIndex={0}>
              <ChartContainer
                config={{
                  [getDataKey()]: {
                    label: getYAxisLabel(),
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="aspect-[4/2] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeData}
                    margin={
                      isMobile ? { top: 20, right: 10, left: 0, bottom: 0 } : { top: 20, right: 30, left: 0, bottom: 0 }
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickMargin={isMobile ? 5 : 10}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                    />
                    <YAxis
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickMargin={isMobile ? 5 : 10}
                      width={isMobile ? 25 : 40}
                      label={{
                        value: getYAxisLabel(),
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: isMobile ? 10 : 12 },
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey={getDataKey()}
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                      role="button"
                      tabIndex={0}
                      aria-label={(props: any) => `${props.date}: ${props[getDataKey()]}`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Data table for screen readers */}
            <div className="sr-only">
              <table>
                <caption>Activity Trends Data</caption>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>{getYAxisLabel()}</th>
                  </tr>
                </thead>
                <tbody>
                  {timeData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.date}</td>
                      <td>{item[getDataKey()]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Category Distribution
            </CardTitle>
            <CardDescription>Breakdown of activities by category</CardDescription>
          </CardHeader>
          <CardContent>
            <VisuallyHidden>
              <div id="category-chart-description">
                Pie chart showing distribution of activities across different categories.
              </div>
            </VisuallyHidden>

            <div aria-labelledby="category-chart-description" role="figure" tabIndex={0}>
              <div className="aspect-[4/3] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={isMobile ? 80 : 100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          role="button"
                          tabIndex={0}
                          aria-label={`${entry.name}: ${entry.count} activities (${((entry.count / filteredActivities.length) * 100).toFixed(0)}%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [`${value} activities`, props.payload.name]}
                      contentStyle={{ fontSize: isMobile ? 12 : 14 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data table for screen readers */}
            <div className="sr-only">
              <table>
                <caption>Category Distribution Data</caption>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.count}</td>
                      <td>{((item.count / filteredActivities.length) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Time of Day Distribution */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time of Day Patterns
            </CardTitle>
            <CardDescription>When you're most active</CardDescription>
          </CardHeader>
          <CardContent>
            <VisuallyHidden>
              <div id="time-of-day-chart-description">
                Bar chart showing activity distribution across different times of day.
              </div>
            </VisuallyHidden>

            <div aria-labelledby="time-of-day-chart-description" role="figure" tabIndex={0}>
              <div className="aspect-[4/3] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeOfDayData}
                    margin={
                      isMobile ? { top: 20, right: 10, left: 0, bottom: 0 } : { top: 20, right: 30, left: 0, bottom: 0 }
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickMargin={isMobile ? 5 : 10}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                    />
                    <YAxis
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickMargin={isMobile ? 5 : 10}
                      width={isMobile ? 25 : 40}
                      label={{
                        value: "Number of Activities",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: isMobile ? 10 : 12 },
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} activities`, "Count"]}
                      contentStyle={{ fontSize: isMobile ? 12 : 14 }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                      role="button"
                      tabIndex={0}
                      aria-label={(props: any) => `${props.name}: ${props.count} activities`}
                    >
                      {timeOfDayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data table for screen readers */}
            <div className="sr-only">
              <table>
                <caption>Time of Day Distribution Data</caption>
                <thead>
                  <tr>
                    <th>Time of Day</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {timeOfDayData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Streak and Stats Card */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              Activity Stats
            </CardTitle>
            <CardDescription>Your activity streaks and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{currentStreak}</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{longestStreak}</div>
                <div className="text-sm text-muted-foreground">Longest Streak</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{filteredActivities.length}</div>
                <div className="text-sm text-muted-foreground">Total Activities</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">
                  {filteredActivities.length > 0
                    ? Math.round(
                        filteredActivities.reduce((sum, act) => sum + act.value, 0) / filteredActivities.length,
                      )
                    : 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg Value</div>
              </div>
            </div>
            {/* Accessible description for screen readers */}
            <div className="sr-only">
              <p>Current streak: {currentStreak} days</p>
              <p>Longest streak: {longestStreak} days</p>
              <p>Total activities: {filteredActivities.length}</p>
              <p>
                Average value:{" "}
                {filteredActivities.length > 0
                  ? Math.round(filteredActivities.reduce((sum, act) => sum + act.value, 0) / filteredActivities.length)
                  : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Duration vs Value Correlation Chart */}
        <Card className="col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Duration vs Value Correlation
            </CardTitle>
            <CardDescription>Explore the relationship between activity duration and value</CardDescription>
          </CardHeader>
          <CardContent>
            <VisuallyHidden>
              <div id="correlation-chart-description">
                Scatter plot showing the relationship between activity duration and value.
              </div>
            </VisuallyHidden>

            <div aria-labelledby="correlation-chart-description" role="figure" tabIndex={0}>
              <div className="aspect-[4/2] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={
                      isMobile
                        ? { top: 20, right: 10, left: 0, bottom: 0 }
                        : { top: 20, right: 30, left: 20, bottom: 10 }
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="duration"
                      name="Duration"
                      unit=" min"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickMargin={isMobile ? 5 : 10}
                      label={{
                        value: "Duration (minutes)",
                        position: "bottom",
                        style: { fontSize: isMobile ? 10 : 12 },
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="value"
                      name="Value"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickMargin={isMobile ? 5 : 10}
                      width={isMobile ? 25 : 40}
                      label={{
                        value: "Value",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: isMobile ? 10 : 12 },
                      }}
                    />
                    <ZAxis type="category" dataKey="category" name="Category" />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value, name) => [value, name]}
                      contentStyle={{ fontSize: isMobile ? 12 : 14 }}
                      labelFormatter={(label) => ""}
                      wrapperStyle={{ zIndex: 1000 }}
                    />
                    <Legend />
                    <Scatter
                      name="Activities"
                      data={correlationData}
                      fill="#8884d8"
                      role="button"
                      tabIndex={0}
                      aria-label={(props: any) =>
                        `Duration: ${props.duration} minutes, Value: ${props.value}, Category: ${props.category}`
                      }
                    >
                      {correlationData.map((entry, index) => {
                        // Find the color index based on category
                        const categoryIndex = categories.indexOf(entry.category)
                        return <Cell key={`cell-${index}`} fill={COLORS[categoryIndex % COLORS.length]} />
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data table for screen readers */}
            <div className="sr-only">
              <table>
                <caption>Duration vs Value Correlation Data</caption>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Duration (minutes)</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {correlationData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.date}</td>
                      <td>{item.category}</td>
                      <td>{item.duration}</td>
                      <td>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
