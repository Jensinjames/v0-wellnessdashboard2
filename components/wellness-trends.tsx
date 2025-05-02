"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { useWellness } from "@/context/wellness-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

export function WellnessTrends() {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly">("daily")
  const { entries, categories } = useWellness()
  const enabledCategories = categories.filter((cat) => cat.enabled)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")
  const chartRef = useRef<HTMLDivElement>(null)

  // Get weekly trend data
  const getWeeklyTrendData = () => {
    // Implementation would be similar to the original but using our new data structure
    // This is a simplified version for demonstration
    return [
      { name: "Week 1", overall: 65, faith: 70, life: 60, work: 75, health: 55 },
      { name: "Week 2", overall: 70, faith: 75, life: 65, work: 80, health: 60 },
      { name: "Week 3", overall: 75, faith: 80, life: 70, work: 85, health: 65 },
      { name: "Week 4", overall: 80, faith: 85, life: 75, work: 90, health: 70 },
    ]
  }

  // Get daily trend data
  const getDailyTrendData = () => {
    // Implementation would be similar to the original but using our new data structure
    // This is a simplified version for demonstration
    return [
      { name: "Mon", overall: 65, faith: 70, life: 60, work: 75, health: 55 },
      { name: "Tue", overall: 70, faith: 75, life: 65, work: 80, health: 60 },
      { name: "Wed", overall: 75, faith: 80, life: 70, work: 85, health: 65 },
      { name: "Thu", overall: 80, faith: 85, life: 75, work: 90, health: 70 },
      { name: "Fri", overall: 85, faith: 90, life: 80, work: 95, health: 75 },
      { name: "Sat", overall: 90, faith: 95, life: 85, work: 100, health: 80 },
      { name: "Sun", overall: 95, faith: 100, life: 90, work: 95, health: 85 },
    ]
  }

  // Get category comparison data
  const getCategoryComparisonData = () => {
    return enabledCategories.map((category) => ({
      name: category.name,
      value: Math.floor(Math.random() * 100), // In a real app, calculate this from entries
      fill: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color for demo
    }))
  }

  // Get radar chart data
  const getRadarChartData = () => {
    return enabledCategories.map((category) => ({
      subject: category.name,
      A: Math.floor(Math.random() * 100), // In a real app, calculate this from entries
      fullMark: 100,
    }))
  }

  // Determine which data to use based on selected time range
  const trendData = timeRange === "daily" ? getDailyTrendData() : getWeeklyTrendData()
  const categoryData = getCategoryComparisonData()
  const radarData = getRadarChartData()

  // For mobile, limit the data points to avoid clutter
  const mobileFilteredTrendData = isMobile ? trendData.filter((_, i) => i % 2 === 0) : trendData

  // Generate accessible text summaries for screen readers
  const generateChartSummary = (data: any[], type: string) => {
    if (type === "trend") {
      const latest = data[data.length - 1]
      const first = data[0]
      const trend =
        latest.overall > first.overall ? "increasing" : latest.overall < first.overall ? "decreasing" : "stable"

      return `${timeRange === "daily" ? "Daily" : "Weekly"} wellness trend chart showing ${trend} trend. 
        Starting at ${first.overall}% and ending at ${latest.overall}%. 
        The chart displays data for overall wellness and individual categories including faith, life, work, and health.`
    } else if (type === "category") {
      return `Category comparison chart showing average scores: ${data.map((item) => `${item.name}: ${item.value}%`).join(", ")}.`
    } else if (type === "radar") {
      return `Wellness balance radar chart showing scores across categories: ${data.map((item) => `${item.subject}: ${item.A}%`).join(", ")}.`
    } else if (type === "progress") {
      const latest = data[data.length - 1]
      return `Progress over time chart showing the most recent score of ${latest.overall}% for overall wellness.`
    }
    return ""
  }

  // Handle keyboard navigation for chart points
  const handleChartKeyDown = (e: React.KeyboardEvent, data: any[]) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault()
      const currentIndex = Number.parseInt((e.target as HTMLElement).getAttribute("data-index") || "0")
      const newIndex =
        e.key === "ArrowRight" ? Math.min(currentIndex + 1, data.length - 1) : Math.max(currentIndex - 1, 0)

      const points = chartRef.current?.querySelectorAll('[role="button"][data-index]')
      if (points && points[newIndex]) {
        ;(points[newIndex] as HTMLElement).focus()

        // Announce the data point to screen readers
        const item = data[newIndex]
        const announcement = `${item.name}: Overall ${item.overall}%, Faith ${item.faith}%, Life ${item.life}%, Work ${item.work}%, Health ${item.health}%`

        const liveRegion = document.getElementById("chart-live-region")
        if (liveRegion) {
          liveRegion.textContent = announcement
        }
      }
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Screen reader only live region for announcing chart data */}
      <div id="chart-live-region" aria-live="polite" className="sr-only"></div>

      {/* Overall Wellness Trend Chart */}
      <Card className="col-span-2 border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2">
          <div>
            <CardTitle>Wellness Trend</CardTitle>
            <CardDescription>Track your overall wellness progress over time</CardDescription>
          </div>
          <div className="flex gap-1 mt-2 sm:mt-0">
            <Button
              variant={timeRange === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("daily")}
              aria-pressed={timeRange === "daily"}
            >
              Daily
            </Button>
            <Button
              variant={timeRange === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("weekly")}
              aria-pressed={timeRange === "weekly"}
            >
              Weekly
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Accessible description for screen readers */}
          <VisuallyHidden>
            <div id="trend-chart-description">{generateChartSummary(trendData, "trend")}</div>
          </VisuallyHidden>

          <div
            ref={chartRef}
            aria-labelledby="trend-chart-description"
            role="figure"
            tabIndex={0}
            onKeyDown={(e) => handleChartKeyDown(e, mobileFilteredTrendData)}
          >
            <ChartContainer
              config={{
                overall: {
                  label: "Overall",
                  color: "hsl(var(--chart-1))",
                },
                faith: {
                  label: "Faith",
                  color: "hsl(142, 71%, 45%)",
                },
                life: {
                  label: "Life",
                  color: "hsl(48, 96%, 53%)",
                },
                work: {
                  label: "Work",
                  color: "hsl(0, 84%, 60%)",
                },
                health: {
                  label: "Health",
                  color: "hsl(330, 81%, 60%)",
                },
              }}
              className="aspect-[4/2] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mobileFilteredTrendData}
                  margin={
                    isMobile ? { top: 20, right: 10, left: 0, bottom: 0 } : { top: 20, right: 30, left: 0, bottom: 0 }
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} tickMargin={isMobile ? 5 : 10} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickMargin={isMobile ? 5 : 10}
                    width={isMobile ? 25 : 40}
                    label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend
                    verticalAlign={isMobile ? "bottom" : "top"}
                    height={isMobile ? 36 : 30}
                    iconSize={isMobile ? 8 : 10}
                    wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overall"
                    stroke="var(--color-overall)"
                    strokeWidth={3}
                    activeDot={{
                      r: isMobile ? 6 : 8,
                      role: "button",
                      tabIndex: 0,
                      "aria-label": (props: any) => `${props.payload.name}: Overall ${props.payload.overall}%`,
                      "data-index": (props: any) => props.index,
                    }}
                    dot={{
                      r: isMobile ? 3 : 4,
                      role: "button",
                      tabIndex: 0,
                      "aria-label": (props: any) => `${props.payload.name}: Overall ${props.payload.overall}%`,
                      "data-index": (props: any) => props.index,
                    }}
                  />
                  {/* On mobile, only show overall by default to avoid clutter */}
                  {!isSmallMobile && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="faith"
                        stroke="var(--color-faith)"
                        strokeWidth={2}
                        dot={{
                          r: isMobile ? 2 : 3,
                          role: "button",
                          tabIndex: 0,
                          "aria-label": (props: any) => `${props.payload.name}: Faith ${props.payload.faith}%`,
                          "data-index": (props: any) => props.index,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="life"
                        stroke="var(--color-life)"
                        strokeWidth={2}
                        dot={{
                          r: isMobile ? 2 : 3,
                          role: "button",
                          tabIndex: 0,
                          "aria-label": (props: any) => `${props.payload.name}: Life ${props.payload.life}%`,
                          "data-index": (props: any) => props.index,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="work"
                        stroke="var(--color-work)"
                        strokeWidth={2}
                        dot={{
                          r: isMobile ? 2 : 3,
                          role: "button",
                          tabIndex: 0,
                          "aria-label": (props: any) => `${props.payload.name}: Work ${props.payload.work}%`,
                          "data-index": (props: any) => props.index,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="health"
                        stroke="var(--color-health)"
                        strokeWidth={2}
                        dot={{
                          r: isMobile ? 2 : 3,
                          role: "button",
                          tabIndex: 0,
                          "aria-label": (props: any) => `${props.payload.name}: Health ${props.payload.health}%`,
                          "data-index": (props: any) => props.index,
                        }}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Data table for screen readers */}
          <div className="sr-only">
            <table>
              <caption>Wellness Trend Data</caption>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Overall</th>
                  <th>Faith</th>
                  <th>Life</th>
                  <th>Work</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.overall}%</td>
                    <td>{item.faith}%</td>
                    <td>{item.life}%</td>
                    <td>{item.work}%</td>
                    <td>{item.health}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Comparison Chart */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
          <CardDescription>Average scores by wellness category</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Accessible description for screen readers */}
          <VisuallyHidden>
            <div id="category-chart-description">{generateChartSummary(categoryData, "category")}</div>
          </VisuallyHidden>

          <div aria-labelledby="category-chart-description" role="figure" tabIndex={0}>
            <div className="aspect-[4/3] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={
                    isMobile ? { top: 20, right: 10, left: 0, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 5 }
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickMargin={isMobile ? 5 : 10}
                    interval={isMobile ? 1 : 0}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickMargin={isMobile ? 5 : 10}
                    width={isMobile ? 25 : 40}
                    label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Score"]}
                    labelFormatter={(label) => `${label} Category`}
                    contentStyle={{ fontSize: isMobile ? 12 : 14 }}
                  />
                  <Bar
                    dataKey="value"
                    nameKey="name"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                    role="button"
                    tabIndex={0}
                    aria-label={(props: any) => `${props.name}: ${props.value}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data table for screen readers */}
          <div className="sr-only">
            <table>
              <caption>Category Comparison Data</caption>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.value}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Balance Radar Chart */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Wellness Balance</CardTitle>
          <CardDescription>Your most recent wellness balance across categories</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Accessible description for screen readers */}
          <VisuallyHidden>
            <div id="radar-chart-description">{generateChartSummary(radarData, "radar")}</div>
          </VisuallyHidden>

          <div aria-labelledby="radar-chart-description" role="figure" tabIndex={0}>
            <div className="aspect-[4/3] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Radar name="Current Balance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Score"]}
                    contentStyle={{ fontSize: isMobile ? 12 : 14 }}
                  />
                  <Legend iconSize={isMobile ? 8 : 10} wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data table for screen readers */}
          <div className="sr-only">
            <table>
              <caption>Wellness Balance Data</caption>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {radarData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.subject}</td>
                    <td>{item.A}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Progress Over Time Area Chart */}
      <Card className="col-span-2 border shadow-sm">
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
          <CardDescription>Visualize your wellness journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overall">
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              {enabledCategories.slice(0, isMobile ? 2 : 4).map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overall" className="mt-0">
              <ProgressAreaChart
                data={mobileFilteredTrendData}
                dataKey="overall"
                color="#8884d8"
                isMobile={isMobile}
                chartSummary={generateChartSummary(mobileFilteredTrendData, "progress")}
              />
            </TabsContent>

            {enabledCategories.slice(0, isMobile ? 2 : 4).map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                <ProgressAreaChart
                  data={mobileFilteredTrendData}
                  dataKey={category.id}
                  color={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                  isMobile={isMobile}
                  chartSummary={`Progress over time chart showing the most recent score for ${category.name}.`}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface ProgressAreaChartProps {
  data: any[]
  dataKey: string
  color: string
  isMobile: boolean
  chartSummary: string
}

function ProgressAreaChart({ data, dataKey, color, isMobile, chartSummary }: ProgressAreaChartProps) {
  return (
    <div className="aspect-[16/5] w-full">
      {/* Accessible description for screen readers */}
      <VisuallyHidden>
        <div id={`progress-chart-${dataKey}-description`}>{chartSummary}</div>
      </VisuallyHidden>

      <div aria-labelledby={`progress-chart-${dataKey}-description`} role="figure" tabIndex={0}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 0 } : { top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} tickMargin={isMobile ? 5 : 10} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickMargin={isMobile ? 5 : 10}
              width={isMobile ? 25 : 40}
              label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, dataKey.charAt(0).toUpperCase() + dataKey.slice(1)]}
              contentStyle={{ fontSize: isMobile ? 12 : 14 }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              strokeWidth={isMobile ? 1.5 : 2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Data table for screen readers */}
      <div className="sr-only">
        <table>
          <caption>Progress Over Time Data for {dataKey}</caption>
          <thead>
            <tr>
              <th>Period</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item[dataKey]}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
