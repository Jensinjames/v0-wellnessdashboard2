"use client"

import { useMemo } from "react"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts"

interface GoalProgressChartProps {
  categoryId: string
  activities?: Array<{
    id: string
    date: Date
    categoryId: string
    subcategories: Array<{
      id: string
      name: string
      parameters: Array<{
        id: string
        name: string
        value: number
        goal?: number
      }>
    }>
  }>
}

export function GoalProgressChart({ categoryId, activities = [] }: GoalProgressChartProps) {
  // Get the most recent activity for this category
  const latestActivity = useMemo(() => {
    if (!activities || activities.length === 0) return undefined

    return activities
      .filter((activity) => activity.categoryId === categoryId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }, [activities, categoryId])

  // Process data for the radar chart
  const chartData = useMemo(() => {
    if (!latestActivity || !latestActivity.subcategories) return []

    // Flatten parameters from all subcategories
    return latestActivity.subcategories.flatMap((subcategory) => {
      if (!subcategory || !subcategory.parameters) return []

      return subcategory.parameters.map((parameter) => ({
        name: parameter.name || "Unnamed",
        value: parameter.value || 0,
        goal: parameter.goal || 0,
        fullMark: 10,
      }))
    })
  }, [latestActivity])

  // No data message
  if (!latestActivity || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No data available for this category
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis angle={30} domain={[0, 10]} />
        <Radar name="Current" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
        <Radar name="Goal" dataKey="goal" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}
