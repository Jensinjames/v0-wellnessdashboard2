"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ActivityScoreChartProps {
  category: {
    id: string
    name: string
    subcategories: {
      id: string
      name: string
    }[]
  }
  activities: {
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
  // Process data for the chart
  const chartData = useMemo(() => {
    // Get the most recent 5 activities
    const recentActivities = activities
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .reverse()

    // Format data for the chart
    return recentActivities.map((activity) => {
      const data: Record<string, any> = {
        date: new Date(activity.date).toLocaleDateString(),
      }

      // Add scores for each subcategory
      category.subcategories.forEach((subcategory) => {
        const subActivity = activity.subcategories.find((s) => s.id === subcategory.id)
        data[subcategory.name] = subActivity?.score || 0
      })

      return data
    })
  }, [category, activities])

  // Generate colors for each subcategory
  const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"]

  // No data message
  if (chartData.length === 0) {
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
        {category.subcategories.map((subcategory, index) => (
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
