"use client"

import { useState, useEffect } from "react"
import { parseISO } from "date-fns"
import { ActivityPatterns } from "@/components/activity-patterns"
import type { Activity } from "@/utils/activity-chart-utils"
import { Skeleton } from "@/components/ui/skeleton"

export default function ActivityPatternsPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  // Simulate loading activities from storage or API
  useEffect(() => {
    // In a real app, you would fetch this from an API or local storage
    const loadActivities = () => {
      // Generate some sample data for demonstration
      const sampleActivities: Activity[] = [
        {
          id: "1",
          categoryId: "faith",
          categoryName: "Faith",
          // subcategoryId: "dailyPrayer",
          // subcategoryName: "Daily Prayer",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0).toISOString(), // today
          duration: 30,
          value: 8,
          timeOfDay: "morning",
        },
        {
          id: "2",
          categoryId: "faith",
          categoryName: "Faith",
          // subcategoryId: "meditation",
          // subcategoryName: "Meditation",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // yesterday
          duration: 20,
          value: 7,
          timeOfDay: "evening",
        },
        {
          id: "3",
          categoryId: "health",
          categoryName: "Health",
          // subcategoryId: "exercise",
          // subcategoryName: "Exercise",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // yesterday
          duration: 45,
          value: 9,
          timeOfDay: "afternoon",
        },
        {
          id: "4",
          categoryId: "work",
          categoryName: "Work",
          // subcategoryId: "productivity",
          // subcategoryName: "Productivity",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          duration: 120,
          value: 8,
          timeOfDay: "morning",
        },
        {
          id: "5",
          categoryId: "life",
          categoryName: "Life",
          // subcategoryId: "familyTime",
          // subcategoryName: "Family Time",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          duration: 180,
          value: 10,
          timeOfDay: "evening",
        },
        {
          id: "6",
          categoryId: "health",
          categoryName: "Health",
          // subcategoryId: "sleep",
          // subcategoryName: "Sleep",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          duration: 480,
          value: 9,
          timeOfDay: "night",
        },
        {
          id: "7",
          categoryId: "faith",
          categoryName: "Faith",
          // subcategoryId: "scriptureStudy",
          // subcategoryName: "Scripture Study",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
          duration: 25,
          value: 7,
          timeOfDay: "morning",
        },
        {
          id: "8",
          categoryId: "work",
          categoryName: "Work",
          // subcategoryId: "learningHours",
          // subcategoryName: "Learning Hours",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          duration: 90,
          value: 8,
          timeOfDay: "afternoon",
        },
        {
          id: "9",
          categoryId: "life",
          categoryName: "Life",
          // subcategoryId: "hobbies",
          // subcategoryName: "Hobbies",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
          duration: 120,
          value: 9,
          timeOfDay: "evening",
        },
        {
          id: "10",
          categoryId: "health",
          categoryName: "Health",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
          duration: 60,
          value: 8,
          timeOfDay: "morning",
        },
        // Add more sample activities for better visualization
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `${i + 11}`,
          categoryId: ["faith", "health", "work", "life"][Math.floor(Math.random() * 4)],
          categoryName: ["Faith", "Health", "Work", "Life"][Math.floor(Math.random() * 4)],
          // subcategoryId: "sample",
          // subcategoryName: "Sample Activity",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 30)).toISOString(), // Random day in last 30 days
          duration: Math.floor(Math.random() * 120) + 15, // 15-135 minutes
          value: Math.floor(Math.random() * 5) + 5, // 5-10 value
          timeOfDay: ["morning", "afternoon", "evening", "night"][Math.floor(Math.random() * 4)],
        })),
      ]

      // Sort by date
      sampleActivities.sort((a, b) => {
        const dateA = typeof a.date === "string" ? parseISO(a.date) : a.date
        const dateB = typeof b.date === "string" ? parseISO(b.date) : b.date
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
