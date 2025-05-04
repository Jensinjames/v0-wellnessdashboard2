// Mock data and utility functions for activity charts

// Define types
export interface Activity {
  id: string
  date: string
  categoryId: string
  categoryName: string
  duration: number
  value: number
  timeOfDay: string
}

interface TimeData {
  date: string
  value: number
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface TimeOfDayData {
  name: string
  value: number
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalDays: number
  lastTenDays: boolean[]
}

interface HeatmapData {
  date: string
  value: number
}

interface CorrelationData {
  activity: string
  correlation: number
}

// Get activity time data
export function getActivityTimeData(
  timeFrame: "week" | "month" | "year",
  category: string,
  viewMode: "frequency" | "duration" | "value",
): TimeData[] {
  // Mock data based on timeFrame, category, and viewMode
  const data: TimeData[] = []

  const daysToGenerate = timeFrame === "week" ? 7 : timeFrame === "month" ? 30 : 365
  const today = new Date()

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date()
    date.setDate(today.getDate() - i)

    // Format date based on timeFrame
    let dateStr = ""
    if (timeFrame === "week") {
      dateStr = date.toLocaleDateString("en-US", { weekday: "short" })
    } else if (timeFrame === "month") {
      dateStr = date.toLocaleDateString("en-US", { day: "numeric", month: "short" })
    } else {
      dateStr = date.toLocaleDateString("en-US", { month: "short" })
    }

    // Generate random value based on viewMode
    let value = 0
    if (viewMode === "frequency") {
      value = Math.floor(Math.random() * 10) + 1
    } else if (viewMode === "duration") {
      value = Math.floor(Math.random() * 120) + 30
    } else {
      value = Math.floor(Math.random() * 5) + 1
    }

    // Adjust value based on category (just for mock data variation)
    if (category !== "all") {
      value = value * (category === "exercise" ? 1.2 : category === "meditation" ? 0.8 : 1)
    }

    data.unshift({ date: dateStr, value })
  }

  return data
}

// Get category distribution data
export function getCategoryDistribution(
  timeFrame: "week" | "month" | "year",
  viewMode: "frequency" | "duration" | "value",
): CategoryData[] {
  // Mock category distribution data
  return [
    { name: "Exercise", value: Math.floor(Math.random() * 50) + 20, color: "#0088FE" },
    { name: "Meditation", value: Math.floor(Math.random() * 30) + 10, color: "#00C49F" },
    { name: "Reading", value: Math.floor(Math.random() * 40) + 15, color: "#FFBB28" },
    { name: "Sleep", value: Math.floor(Math.random() * 60) + 30, color: "#FF8042" },
    { name: "Nutrition", value: Math.floor(Math.random() * 45) + 25, color: "#8884d8" },
  ]
}

// Get time of day distribution data
export function getTimeOfDayDistribution(timeFrame: "week" | "month" | "year", category: string): TimeOfDayData[] {
  // Mock time of day distribution data
  return [
    { name: "Morning", value: Math.floor(Math.random() * 30) + 10 },
    { name: "Afternoon", value: Math.floor(Math.random() * 40) + 15 },
    { name: "Evening", value: Math.floor(Math.random() * 35) + 20 },
    { name: "Night", value: Math.floor(Math.random() * 20) + 5 },
  ]
}

// Get streak data
export function getStreakData(category: string): StreakData {
  // Mock streak data
  const currentStreak = Math.floor(Math.random() * 14) + 1
  const longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 30) + 7)
  const totalDays = Math.floor(Math.random() * 100) + 30

  // Generate last ten days activity (true/false)
  const lastTenDays: boolean[] = []
  for (let i = 0; i < 10; i++) {
    // Make more recent days more likely to be active for a realistic streak
    const probability = i < currentStreak ? 0.9 : 0.4
    lastTenDays.push(Math.random() < probability)
  }

  return {
    currentStreak,
    longestStreak,
    totalDays,
    lastTenDays,
  }
}

// Get heatmap data
export function getHeatmapData(timeFrame: "week" | "month" | "year", category: string): HeatmapData[] {
  // Mock heatmap data - generate a 7x7 grid (7 days x 7 weeks)
  const data: HeatmapData[] = []
  const today = new Date()

  for (let i = 0; i < 49; i++) {
    const date = new Date()
    date.setDate(today.getDate() - i)
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    // Random value between 0-3 (0: none, 1: low, 2: medium, 3: high)
    const value = Math.floor(Math.random() * 4)

    data.push({ date: dateStr, value })
  }

  return data
}

// Get activity correlation data
export function getActivityCorrelationData(category: string): CorrelationData[] {
  // Mock correlation data
  return [
    { activity: "Sleep → Meditation", correlation: 0.78 },
    { activity: "Exercise → Mood", correlation: 0.65 },
    { activity: "Reading → Sleep", correlation: 0.42 },
    { activity: "Nutrition → Energy", correlation: 0.56 },
    { activity: "Meditation → Focus", correlation: 0.71 },
    { activity: "Exercise → Sleep", correlation: 0.48 },
    { activity: "Screen Time → Sleep", correlation: -0.53 },
    { activity: "Social → Mood", correlation: 0.61 },
  ]
}

// Get correlation data for scatter plot
export function getCorrelationData(activities: Activity[]): any[] {
  // If we have real activities, we could process them here
  // For now, return mock data
  return Array(20)
    .fill(0)
    .map((_, i) => ({
      date: new Date().toISOString().split("T")[0],
      category: ["Exercise", "Meditation", "Reading", "Sleep"][i % 4],
      duration: Math.floor(Math.random() * 120) + 10,
      value: Math.floor(Math.random() * 10) + 1,
    }))
}
