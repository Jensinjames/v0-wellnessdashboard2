"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useWellness } from "@/context/wellness-context"
import { useMobileDetection } from "@/hooks/use-mobile-detection"

export function WellnessTrends() {
  const { entries } = useWellness()
  const { isMobile } = useMobileDetection()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week")
  const [metricType, setMetricType] = useState<"mood" | "energy" | "stress" | "sleep">("mood")

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Wellness Trends</CardTitle>
          <CardDescription>Track your wellness metrics over time</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: "week" | "month" | "year") => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
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
        <Tabs defaultValue="trends">
          <TabsList className="mb-4">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="trends">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={metricType === "mood" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetricType("mood")}
                >
                  Mood
                </Button>
                <Button
                  variant={metricType === "energy" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetricType("energy")}
                >
                  Energy
                </Button>
                <Button
                  variant={metricType === "stress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetricType("stress")}
                >
                  Stress
                </Button>
                <Button
                  variant={metricType === "sleep" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetricType("sleep")}
                >
                  Sleep
                </Button>
              </div>

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
            </div>
          </TabsContent>
          <TabsContent value="correlations">
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
          </TabsContent>
          <TabsContent value="insights">
            <div className="space-y-4">
              {insightData.map((insight, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    insight.impact === "high"
                      ? "border-green-200 bg-green-50"
                      : insight.impact === "medium"
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <h3 className="font-medium">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
