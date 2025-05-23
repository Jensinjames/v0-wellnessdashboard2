"use client"

import { useState, useId } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useWellness } from "@/context/wellness-context"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import { LiveRegion, useScreenReaderAnnouncer } from "@/components/accessibility/screen-reader-announcer"
import { generateUniqueId } from "@/utils/accessibility-utils"
import { safeCn, conditionalCn } from "@/utils/safe-class-names"

export function WellnessTrends() {
  const { entries } = useWellness()
  const { isMobile } = useMobileDetection()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week")
  const [metricType, setMetricType] = useState<"mood" | "energy" | "stress" | "sleep">("mood")
  const { announce } = useScreenReaderAnnouncer()
  const [activeTab, setActiveTab] = useState("trends")

  // Generate unique IDs
  const baseId = useId().replace(/:/g, "-")
  const tabsId = `${baseId}-tabs`
  const trendsTabId = `${baseId}-trends-tab`
  const correlationsTabId = `${baseId}-correlations-tab`
  const insightsTabId = `${baseId}-insights-tab`
  const timeRangeSelectId = `${baseId}-timerange-select`

  // Mock data for the charts
  const trendData = [
    { date: "Mon", mood: 7, energy: 6, stress: 4, sleep: 7 },
    { date: "Tue", mood: 6, energy: 5, stress: 5, sleep: 6 },
    { date: "Wed", mood: 8, energy: 7, stress: 3, sleep: 8 },
    { date: "Thu", mood: 7, energy: 8, stress: 2, sleep: 7 },
    { date: "Fri", mood: 9, energy: 8, stress: 2, sleep: 9 },
    { date: "Sat", mood: 8, energy: 7, stress: 3, sleep: 8 },
    { date: "Sun", mood: 7, energy: 6, stress: 4, sleep: 7 },
  ]

  const correlationData = [
    { name: "Sleep-Mood", value: 0.75 },
    { name: "Exercise-Energy", value: 0.82 },
    { name: "Meditation-Stress", value: -0.65 },
    { name: "Nutrition-Energy", value: 0.58 },
    { name: "Screen Time-Sleep", value: -0.45 },
  ]

  const insightData = [
    {
      title: "Sleep Quality",
      description: "Your sleep quality has improved by 15% this week.",
      impact: "high",
    },
    {
      title: "Exercise Impact",
      description: "Days with exercise show 25% higher energy levels.",
      impact: "medium",
    },
    {
      title: "Stress Management",
      description: "Meditation sessions correlate with lower stress levels.",
      impact: "high",
    },
  ]

  // Handle time range change
  const handleTimeRangeChange = (value: "week" | "month" | "year") => {
    setTimeRange(value)
    const timeRangeLabels = { week: "This Week", month: "This Month", year: "This Year" }
    announce(`Time range changed to ${timeRangeLabels[value]}`, "polite")
  }

  // Handle metric type change
  const handleMetricTypeChange = (type: "mood" | "energy" | "stress" | "sleep") => {
    setMetricType(type)
    const metricLabels = {
      mood: "Mood",
      energy: "Energy",
      stress: "Stress",
      sleep: "Sleep",
    }
    announce(`Metric changed to ${metricLabels[type]}`, "polite")
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Get insight card class based on impact
  const getInsightCardClass = (impact: string) => {
    return safeCn(
      "rounded-lg border p-4",
      conditionalCn({
        condition: impact === "high",
        true: "border-green-700 bg-green-50 dark:border-green-800 dark:bg-green-950 text-green-900 dark:text-green-50",
        false: conditionalCn({
          condition: impact === "medium",
          true: "border-blue-700 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 text-blue-900 dark:text-blue-50",
          false: "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 text-gray-900 dark:text-gray-50",
        }),
      }),
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Wellness Trends</CardTitle>
          <CardDescription>Track your wellness metrics over time</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: "week" | "month" | "year") => handleTimeRangeChange(value)}>
            <SelectTrigger className="w-[120px]" id={timeRangeSelectId} aria-label="Select time range">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends" id={tabsId} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger
              value="trends"
              id={trendsTabId}
              aria-controls={`panel-trends-${tabsId}`}
              aria-selected={activeTab === "trends"}
            >
              Trends
            </TabsTrigger>
            <TabsTrigger
              value="correlations"
              id={`tab-correlations-${generateUniqueId()}`}
              aria-controls={`panel-correlations-${tabsId}`}
              aria-selected={activeTab === "correlations"}
            >
              Correlations
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              id={`tab-insights-${generateUniqueId()}`}
              aria-controls={`panel-insights-${tabsId}`}
              aria-selected={activeTab === "insights"}
            >
              Insights
            </TabsTrigger>
          </TabsList>
          <TabsContent value="trends" id={`panel-trends-${tabsId}`}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select metric type">
                <Button
                  variant={metricType === "mood" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMetricTypeChange("mood")}
                  aria-pressed={metricType === "mood"}
                >
                  Mood
                </Button>
                <Button
                  variant={metricType === "energy" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMetricTypeChange("energy")}
                  aria-pressed={metricType === "energy"}
                >
                  Energy
                </Button>
                <Button
                  variant={metricType === "stress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMetricTypeChange("stress")}
                  aria-pressed={metricType === "stress"}
                >
                  Stress
                </Button>
                <Button
                  variant={metricType === "sleep" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMetricTypeChange("sleep")}
                  aria-pressed={metricType === "sleep"}
                >
                  Sleep
                </Button>
              </div>

              <LiveRegion>
                <ChartContainer
                  config={{
                    [metricType]: {
                      label: metricType.charAt(0).toUpperCase() + metricType.slice(1),
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="aspect-[4/2] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={metricType}
                        stroke={`var(--color-${metricType})`}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <span className="sr-only">Chart showing trends for {metricType} over time.</span>
              </LiveRegion>
            </div>
          </TabsContent>
          <TabsContent value="correlations" id={`panel-correlations-${tabsId}`}>
            <LiveRegion>
              <ChartContainer
                config={{
                  value: {
                    label: "Correlation Strength",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="aspect-[4/2] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={correlationData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-1, 1]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="value" fill="var(--color-value)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <span className="sr-only">Chart showing correlation between sleep and productivity</span>
            </LiveRegion>
          </TabsContent>
          <TabsContent value="insights" id={`panel-insights-${tabsId}`}>
            <div className="space-y-4">
              {insightData.map((insight, index) => {
                const insightId = generateUniqueId(`insight-${index}`)
                return (
                  <div
                    key={index}
                    id={insightId}
                    className={getInsightCardClass(insight.impact)}
                    role="article"
                    aria-labelledby={`${insightId}-title`}
                  >
                    <h3 id={`${insightId}-title`} className="font-medium">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
