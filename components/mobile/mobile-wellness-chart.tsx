"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWellness } from "@/context/wellness-context"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Define the types
interface WellnessEntryData {
  id: string
  date: string
  metrics: {
    metricId: string
    categoryId: string
    value: number
  }[]
}

interface WellnessCategory {
  id: string
  name: string
  enabled: boolean
  metrics: {
    id: string
    name: string
    min: number
    max: number
  }[]
}

export function MobileWellnessChart() {
  const { entries, categories } = useWellness()
  const [chartType, setChartType] = useState<"area" | "bar">("area")
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week")

  // Get data for chart
  const chartData = getChartData(entries, categories, timeRange)

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as "area" | "bar")} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-[160px] grid-cols-2">
              <TabsTrigger value="area">Trend</TabsTrigger>
              <TabsTrigger value="bar">Daily</TabsTrigger>
            </TabsList>

            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "week" | "month" | "all")}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Tabs>
      </CardHeader>
      <CardContent className="p-3 pt-4">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip contentStyle={{ fontSize: "12px" }} formatter={(value) => [`${value}%`, "Score"]} />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip contentStyle={{ fontSize: "12px" }} formatter={(value) => [`${value}%`, "Score"]} />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to get chart data
function getChartData(entries: WellnessEntryData[], categories: WellnessCategory[], timeRange: string) {
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Filter entries based on time range
  const filteredEntries = filterEntriesByTimeRange(sortedEntries, timeRange)

  // Group entries by date and calculate average score
  const groupedData = groupEntriesByDate(filteredEntries, categories)

  return groupedData
}

// Helper function to filter entries by time range
function filterEntriesByTimeRange(entries: WellnessEntryData[], timeRange: string) {
  const now = new Date()

  switch (timeRange) {
    case "week":
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      return entries.filter((entry) => new Date(entry.date) >= weekAgo)

    case "month":
      const monthAgo = new Date()
      monthAgo.setMonth(now.getMonth() - 1)
      return entries.filter((entry) => new Date(entry.date) >= monthAgo)

    default:
      return entries
  }
}

// Helper function to group entries by date and calculate scores
function groupEntriesByDate(entries: WellnessEntryData[], categories: WellnessCategory[]) {
  const dateMap = new Map<string, number[]>()

  // Group scores by date
  entries.forEach((entry) => {
    const date = new Date(entry.date)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

    // Calculate score for this entry
    const score = calculateEntryScore(entry, categories)

    if (dateMap.has(dateStr)) {
      dateMap.get(dateStr)?.push(score)
    } else {
      dateMap.set(dateStr, [score])
    }
  })

  // Calculate average score for each date
  const result = Array.from(dateMap.entries()).map(([date, scores]) => {
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return {
      date,
      score: Math.round(avgScore),
    }
  })

  return result
}

// Helper function to calculate score for an entry
function calculateEntryScore(entry: WellnessEntryData, categories: WellnessCategory[]) {
  const enabledCategories = categories.filter((c) => c.enabled)
  if (enabledCategories.length === 0) return 0

  let totalScore = 0
  let categoryCount = 0

  enabledCategories.forEach((category) => {
    const categoryMetrics = entry.metrics.filter((m) => m.categoryId === category.id)

    if (categoryMetrics.length > 0) {
      let score = 0
      categoryMetrics.forEach((metric) => {
        const metricDef = category.metrics.find((m) => m.id === metric.metricId)
        if (metricDef) {
          if (metricDef.id === "stressLevel") {
            // For stress level, lower is better
            score += ((metricDef.max - metric.value) / (metricDef.max - metricDef.min)) * 100
          } else {
            score += (metric.value / metricDef.max) * 100
          }
        }
      })

      totalScore += score / categoryMetrics.length
      categoryCount++
    }
  })

  return categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0
}
