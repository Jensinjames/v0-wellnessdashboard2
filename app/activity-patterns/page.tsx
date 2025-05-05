"use client"

import { useState, useEffect } from "react"
import { ActivityPatterns } from "@/components/activity-patterns"
import type { Activity } from "@/components/activity-patterns"
import { Skeleton } from "@/components/ui/skeleton"

export default function ActivityPatternsPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  // Simulate loading activities
  useEffect(() => {
    const loadActivities = () => {
      // Sample data
      const sampleActivities: Activity[] = [
        {
          id: "1",
          categoryId: "faith",
          categoryName: "Faith",
          subcategoryId: "dailyPrayer",
          subcategoryName: "Daily Prayer",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0), // today
          duration: 30,
          value: 8,
        },
        {
          id: "2",
          categoryId: "faith",
          categoryName: "Faith",
          subcategoryId: "meditation",
          subcategoryName: "Meditation",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // yesterday
          duration: 20,
          value: 7,
        },
      ]

      // Sort by date
      sampleActivities.sort((a, b) => {
        const dateA = typeof a.date === "string" ? new Date(a.date) : a.date
        const dateB = typeof b.date === "string" ? new Date(b.date) : b.date
        return dateB.getTime() - dateA.getTime() // newest first
      })

      setActivities(sampleActivities)
      setLoading(false)
    }

    // Simulate API delay
    setTimeout(loadActivities, 800)
  }, [])

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Activity Patterns</h1>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      ) : (
        <ActivityPatterns activities={activities} />
      )}
    </div>
  )
}
