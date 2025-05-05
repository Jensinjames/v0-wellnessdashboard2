"use client"

import type React from "react"

import { Activity, Brain, Heart, Moon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useWellness } from "@/context/wellness-context"

export function MobileMetricCards() {
  const { entries, categories } = useWellness()

  // Get today's date with time set to 00:00:00
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter entries for today
  const todayEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)
    return entryDate.getTime() === today.getTime()
  })

  // Calculate overall score
  const calculateOverallScore = () => {
    if (todayEntries.length === 0) return 0

    const enabledCategories = categories.filter((c) => c.enabled)
    if (enabledCategories.length === 0) return 0

    let totalScore = 0
    let categoryCount = 0

    enabledCategories.forEach((category) => {
      const categoryMetrics = todayEntries.flatMap((entry) => entry.metrics.filter((m) => m.categoryId === category.id))

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

  // Calculate sleep score
  const calculateSleepScore = () => {
    const sleepEntries = todayEntries.flatMap((entry) => entry.metrics.filter((m) => m.metricId === "sleepDuration"))

    if (sleepEntries.length === 0) return 0

    const totalSleep = sleepEntries.reduce((sum, entry) => sum + entry.value, 0)
    // Assuming ideal sleep is 8 hours
    return Math.min(100, Math.round((totalSleep / 8) * 100))
  }

  // Calculate stress score
  const calculateStressScore = () => {
    const stressEntries = todayEntries.flatMap((entry) => entry.metrics.filter((m) => m.metricId === "stressLevel"))

    if (stressEntries.length === 0) return 0

    const avgStress = stressEntries.reduce((sum, entry) => sum + entry.value, 0) / stressEntries.length
    // Stress is on a scale of 1-10, where lower is better
    return Math.round(((10 - avgStress) / 9) * 100)
  }

  // Calculate activity score
  const calculateActivityScore = () => {
    const activityEntries = todayEntries.flatMap((entry) =>
      entry.metrics.filter((m) => m.metricId === "exerciseDuration" || m.metricId === "stepCount"),
    )

    if (activityEntries.length === 0) return 0

    let score = 0
    activityEntries.forEach((metric) => {
      if (metric.metricId === "exerciseDuration") {
        // Assuming 60 minutes is ideal
        score += Math.min(100, (metric.value / 60) * 100)
      } else if (metric.metricId === "stepCount") {
        // Assuming 10000 steps is ideal
        score += Math.min(100, (metric.value / 10000) * 100)
      }
    })

    return Math.round(score / activityEntries.length)
  }

  const overallScore = calculateOverallScore()
  const sleepScore = calculateSleepScore()
  const stressScore = calculateStressScore()
  const activityScore = calculateActivityScore()

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        title="Overall"
        value={`${overallScore}%`}
        icon={<Activity className="h-4 w-4 text-white" />}
        color="bg-blue-500"
      />
      <MetricCard
        title="Sleep"
        value={`${sleepScore}%`}
        icon={<Moon className="h-4 w-4 text-white" />}
        color="bg-indigo-500"
      />
      <MetricCard
        title="Stress"
        value={`${stressScore}%`}
        icon={<Brain className="h-4 w-4 text-white" />}
        color="bg-purple-500"
      />
      <MetricCard
        title="Activity"
        value={`${activityScore}%`}
        icon={<Heart className="h-4 w-4 text-white" />}
        color="bg-green-500"
      />
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className={`rounded-md ${color} p-1.5`}>{icon}</div>
        </div>
        <div className="mt-2">
          <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
          <p className="mt-0.5 text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
