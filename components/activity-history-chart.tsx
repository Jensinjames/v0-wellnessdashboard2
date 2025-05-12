"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ActivityHistoryChartProps {
  activityHistory?: {
    id: string
    date: Date
    categoryId: string
    overallScore: number
  }[]
}

export function ActivityHistoryChart({ activityHistory = [] }: ActivityHistoryChartProps) {
  // Process data for the chart
  const chartData = useMemo(() => {
    // If no activity history, return empty array
    if (!activityHistory || activityHistory.length === 0) {
      return []
    }

    // Group activities by date and category
    const groupedData: Record<string, Record<string, number>> = {}

    activityHistory.forEach((activity) => {
      if (!activity || !activity.date) return

      const dateStr = new Date(activity.date).toLocaleDateString()

      if (!groupedData[dateStr]) {
        groupedData[dateStr] = {}
      }

      if (activity.categoryId) {
        groupedData[dateStr][activity.categoryId] = activity.overallScore
      }
    })

    // Convert to array format for chart
    return Object.entries(groupedData).map(([date, categories]) => ({
      date,
      ...categories,
    }))
  }, [activityHistory])

  // Category colors
  const categoryColors: Record<string, string> = {
    health: "#ef4444",
    faith: "#22c55e",
    work: "#3b82f6",
    life: "#f59e0b",
  }

  // Get unique categories from the data
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()

    if (chartData) {
      chartData.forEach((dataPoint) => {
        Object.keys(dataPoint).forEach((key) => {
          if (key !== "date" && categoryColors[key]) {
            categories.add(key)
          }
        })
      })
    }

    return Array.from(categories)
  }, [chartData])

  // No data message
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">No activity data available</div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 10]} />
        <Tooltip />
        <Legend />
        {uniqueCategories.map((category) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={categoryColors[category]}
            activeDot={{ r: 8 }}
            strokeWidth={2}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
