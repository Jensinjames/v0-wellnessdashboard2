"use client"

// This is a demonstration file showing the current data flow and potential duplication points
// in the wellness dashboard category management system

/**
 * Current Data Flow:
 *
 * 1. Activities are generated randomly
 * 2. Activity data is used in charts
 */

// Define the structure for an activity
export interface Activity {
  id: string
  categoryId: string
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  date: Date
  duration: number
  value: number
}

// Mock data generation for activity charts

// Get activity time data
export function getActivityTimeData(
  timeFrame: "week" | "month" | "year",
  category: string,
  viewMode: "frequency" | "duration" | "value",
) {
  const data = []
  const days = timeFrame === "week" ? 7 : timeFrame === "month" ? 30 : 365
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    // Generate random value based on view mode
    let value
    if (viewMode === "frequency") {
      value = Math.floor(Math.random() * 5) + 1
    } else if (viewMode === "duration") {
      value = Math.floor(Math.random() * 120) + 15 // 15-135 minutes
    } else {
      value = Math.random() * 10 // 0-10 value
    }

    data.push({
      date: dateStr,
      value,
    })
  }

  return data
}

// Get category distribution data
export function getCategoryDistribution(
  timeFrame: "week" | "month" | "year",
  viewMode: "frequency" | "duration" | "value",
) {
  const categories = [
    { name: "Exercise", color: "#FF6384" },
    { name: "Meditation", color: "#36A2EB" },
    { name: "Reading", color: "#FFCE56" },
    { name: "Sleep", color: "#4BC0C0" },
    { name: "Nutrition", color: "#9966FF" },
  ]

  return categories.map((category) => {
    let value
    if (viewMode === "frequency") {
      value = Math.floor(Math.random() * 50) + 10
    } else if (viewMode === "duration") {
      value = Math.floor(Math.random() * 1000) + 100
    } else {
      value = Math.random() * 100
    }

    return {
      ...category,
      value,
    }
  })
}

// Get time of day distribution
export function getTimeOfDayDistribution(timeFrame: "week" | "month" | "year", category: string) {
  const timeSlots = [
    { name: "Morning", value: Math.floor(Math.random() * 30) + 5 },
    { name: "Afternoon", value: Math.floor(Math.random() * 30) + 5 },
    { name: "Evening", value: Math.floor(Math.random() * 30) + 5 },
    { name: "Night", value: Math.floor(Math.random() * 30) + 5 },
  ]

  return timeSlots
}

// Get streak data
export function getStreakData(category: string) {
  const currentStreak = Math.floor(Math.random() * 14) + 1
  const longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 30) + 7)
  const totalDays = Math.floor(Math.random() * 100) + 30

  // Generate last 10 days activity (true/false)
  const lastTenDays = Array(10)
    .fill(null)
    .map(() => Math.random() > 0.3)

  return {
    currentStreak,
    longestStreak,
    totalDays,
    lastTenDays,
  }
}

// Get heatmap data
export function getHeatmapData(timeFrame: "week" | "month" | "year", category: string) {
  const days = 28 // 4 weeks
  const data = []

  for (let i = 0; i < days; i++) {
    data.push({
      date: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 4), // 0-3 intensity
    })
  }

  return data
}

// Get activity correlation data
export function getActivityCorrelationData(category: string) {
  const activities = ["Sleep", "Exercise", "Meditation", "Reading", "Nutrition", "Hydration", "Social", "Work"]

  return activities
    .filter((a) => a.toLowerCase() !== category.toLowerCase())
    .map((activity) => ({
      activity,
      correlation: Math.random(), // 0-1 correlation
    }))
}
