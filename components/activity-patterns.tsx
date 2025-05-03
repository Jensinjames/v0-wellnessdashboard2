"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Sample data - in a real app, this would come from your data source
const activityData = [
  { day: "Mon", morning: 4, afternoon: 3, evening: 2, night: 1 },
  { day: "Tue", morning: 3, afternoon: 5, evening: 2, night: 0 },
  { day: "Wed", morning: 2, afternoon: 4, evening: 3, night: 1 },
  { day: "Thu", morning: 5, afternoon: 2, evening: 4, night: 0 },
  { day: "Fri", morning: 3, afternoon: 3, evening: 5, night: 2 },
  { day: "Sat", morning: 1, afternoon: 4, evening: 6, night: 3 },
  { day: "Sun", morning: 2, afternoon: 5, evening: 4, night: 1 },
]

const timeBlocks = [
  { id: "morning", name: "Morning (5am-12pm)", color: "#22d3ee" },
  { id: "afternoon", name: "Afternoon (12pm-5pm)", color: "#a78bfa" },
  { id: "evening", name: "Evening (5pm-10pm)", color: "#f97316" },
  { id: "night", name: "Night (10pm-5am)", color: "#64748b" },
]

const categoryData = [
  { name: "Work", value: 35, color: "#ef4444" },
  { name: "Exercise", value: 20, color: "#22c55e" },
  { name: "Family", value: 15, color: "#3b82f6" },
  { name: "Learning", value: 10, color: "#a855f7" },
  { name: "Leisure", value: 15, color: "#eab308" },
  { name: "Other", value: 5, color: "#64748b" },
]

const weeklyData = [
  { week: "Week 1", work: 30, exercise: 15, family: 20, learning: 10, leisure: 20, other: 5 },
  { week: "Week 2", work: 35, exercise: 20, family: 15, learning: 15, leisure: 10, other: 5 },
  { week: "Week 3", work: 25, exercise: 25, family: 20, learning: 10, leisure: 15, other: 5 },
  { week: "Week 4", work: 30, exercise: 20, family: 25, learning: 5, leisure: 15, other: 5 },
]

const categoryColors = {
  work: "#ef4444",
  exercise: "#22c55e",
  family: "#3b82f6",
  learning: "#a855f7",
  leisure: "#eab308",
  other: "#64748b",
}

export function ActivityPatterns() {
  const [activeTab, setActiveTab] = useState("daily")

  // Use the cn utility to safely combine class names
  const getTabClass = (tab: string) =>
    cn(
      "px-4 py-2 text-sm font-medium rounded-md cursor-pointer",
      activeTab === tab
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Activity Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <button onClick={() => setActiveTab("daily")} className={getTabClass("daily")}>
            Daily
          </button>
          <button onClick={() => setActiveTab("weekly")} className={getTabClass("weekly")}>
            Weekly
          </button>
          <button onClick={() => setActiveTab("monthly")} className={getTabClass("monthly")}>
            Monthly
          </button>
        </div>

        <div className="mt-4">
          {activeTab === "daily" && (
            <div className="p-4 bg-muted rounded-md">
              <p>Daily activity patterns will be displayed here.</p>
            </div>
          )}
          {activeTab === "weekly" && (
            <div className="p-4 bg-muted rounded-md">
              <p>Weekly activity patterns will be displayed here.</p>
            </div>
          )}
          {activeTab === "monthly" && (
            <div className="p-4 bg-muted rounded-md">
              <p>Monthly activity patterns will be displayed here.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
