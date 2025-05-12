"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useWellness } from "@/context/wellness-context"

interface ActivityScoreChartProps {
  category?: {
    id: string
    name: string
    subcategories: {
      id: string
      name: string
    }[]
  }
  activities?: {
    id: string
    date: Date
    subcategories: {
      id: string
      name: string
      score: number
    }[]
  }[]
}

export function ActivityScoreChart({ category, activities }: ActivityScoreChartProps) {
  const { categories, entries } = useWellness()

  // Use provided category or default to the first category
  const activeCategory = useMemo(() => {
    if (category) return category
    return categories && categories.length > 0 ? categories[0] : null
  }, [category, categories])

  // Use provided activities or generate from entries
  const activeActivities = useMemo(() => {
    if (activities) return activities

    // If no activities provided, generate from entries
    if (!entries || !activeCategory) return []

    return entries.map((entry) => ({
      id: entry.id,
      date: new Date(entry.date),
      subcategories: activeCategory.metrics.map((metric) => {
        const metricEntry = entry.metrics.find((m) => m.categoryId === activeCategory.id && m.metricId === metric.id)
        return {
          id: metric.id,
          name: metric.name,
          score: metricEntry ? metricEntry.value : 0,
        }
      }),
    }))
  }, [activities, entries, activeCategory])

  // Process data for the chart
  const chartData = useMemo(() => {
    // Handle empty data case
    if (!activeActivities || activeActivities.length === 0 || !activeCategory) {
      return []
    }

    // Get the most recent 5 activities
    const recentActivities = [...activeActivities]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .reverse()

    // Format data for the chart
    return recentActivities.map((activity) => {
      const data: Record<string, any> = {
        date: new Date(activity.date).toLocaleDateString(),
      }

      // Add scores for each subcategory
      if (activeCategory && activeCategory.metrics) {
        activeCategory.metrics.forEach((subcategory) => {
          const subActivity = activity.subcategories.find((s) => s.id === subcategory.id)
          data[subcategory.name] = subActivity?.score || 0
        })
      }

      return data
    })
  }, [activeActivities, activeCategory])

  // Generate colors for each subcategory
  const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"]

  // No data message
  if (!activeCategory || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No data available for this category
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 10]} />
        <Tooltip />
        <Legend />
        {activeCategory.metrics.map((subcategory, index) => (
          <Bar
            key={subcategory.id}
            dataKey={subcategory.name}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
