// Define the Activity type
export interface Activity {
  id: string
  date: string
  categoryId: string
  categoryName: string
  name: string
  duration: number
  value: number
}

// Function to get activity time data
export function getActivityTimeData(
  activities: Activity[],
  timeFrame: "daily" | "weekly" | "monthly",
): { date: string; count: number; totalDuration: number; avgValue: number }[] {
  // This is a simplified implementation for demonstration
  // In a real app, you would process the activities based on the timeFrame

  // Group activities by date
  const groupedByDate = activities.reduce(
    (acc, activity) => {
      const date = activity.date.split("T")[0] // Extract date part
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          totalDuration: 0,
          totalValue: 0,
        }
      }
      acc[date].count += 1
      acc[date].totalDuration += activity.duration
      acc[date].totalValue += activity.value
      return acc
    },
    {} as Record<string, { count: number; totalDuration: number; totalValue: number }>,
  )

  // Convert to array format
  return Object.entries(groupedByDate).map(([date, data]) => ({
    date,
    count: data.count,
    totalDuration: data.totalDuration,
    avgValue: data.count > 0 ? data.totalValue / data.count : 0,
  }))
}

// Function to get category distribution
export function getCategoryDistribution(activities: Activity[]): { name: string; count: number }[] {
  // Group activities by category
  const groupedByCategory = activities.reduce(
    (acc, activity) => {
      if (!acc[activity.categoryName]) {
        acc[activity.categoryName] = 0
      }
      acc[activity.categoryName] += 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert to array format
  return Object.entries(groupedByCategory).map(([name, count]) => ({
    name,
    count,
  }))
}

// Function to get time of day distribution
export function getTimeOfDayDistribution(activities: Activity[]): { name: string; count: number }[] {
  // Define time periods
  const timePeriods = [
    { name: "Morning", start: 5, end: 12 },
    { name: "Afternoon", start: 12, end: 17 },
    { name: "Evening", start: 17, end: 21 },
    { name: "Night", start: 21, end: 5 },
  ]

  // Initialize counts
  const counts = timePeriods.reduce(
    (acc, period) => {
      acc[period.name] = 0
      return acc
    },
    {} as Record<string, number>,
  )

  // Count activities by time period
  activities.forEach((activity) => {
    const date = new Date(activity.date)
    const hour = date.getHours()

    const period = timePeriods.find(
      (p) =>
        (p.start < p.end && hour >= p.start && hour < p.end) || (p.start > p.end && (hour >= p.start || hour < p.end)),
    )

    if (period) {
      counts[period.name] += 1
    }
  })

  // Convert to array format
  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
  }))
}

// Function to get streak data
export function getStreakData(activities: Activity[]): {
  currentStreak: number
  longestStreak: number
  totalDays: number
  lastTenDays: boolean[]
} {
  // Sort activities by date
  const sortedActivities = [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Get unique dates
  const uniqueDates = new Set(sortedActivities.map((a) => a.date.split("T")[0]))
  const uniqueDatesList = Array.from(uniqueDates)

  // Calculate streaks
  let currentStreak = 0
  let longestStreak = 0
  const currentStreakCount = 0

  // This is a simplified implementation
  // In a real app, you would check for consecutive days

  // For demonstration, we'll just use the count of unique dates
  currentStreak = Math.min(uniqueDatesList.length, 7)
  longestStreak = Math.min(uniqueDatesList.length, 14)

  // Generate last ten days data
  const lastTenDays = Array(10)
    .fill(false)
    .map((_, i) => Math.random() > 0.3)

  return {
    currentStreak,
    longestStreak,
    totalDays: uniqueDatesList.length,
    lastTenDays,
  }
}

// Function to get correlation data
export function getCorrelationData(activities: Activity[]): {
  date: string
  duration: number
  value: number
  category: string
}[] {
  // Return activities in the format needed for the scatter plot
  return activities.map((activity) => ({
    date: activity.date,
    duration: activity.duration,
    value: activity.value,
    category: activity.categoryName,
  }))
}

// Function to get activity correlation data
export function getActivityCorrelationData(categoryFilter: string): {
  activity: string
  correlation: number
}[] {
  // This is a simplified implementation for demonstration
  // In a real app, you would calculate actual correlations

  const activities = ["Sleep", "Exercise", "Meditation", "Reading", "Work", "Social"]

  // Generate random correlation data
  return activities.map((activity) => ({
    activity,
    correlation: Math.random(), // 0-1 correlation
  }))
}

// Function to get heatmap data
export function getHeatmapData(
  timeFrame: string,
  categoryFilter: string,
): {
  date: string
  value: number
}[] {
  // This is a simplified implementation for demonstration
  // In a real app, you would generate data based on actual activities

  // Generate 28 days of data (4 weeks)
  return Array(28)
    .fill(0)
    .map((_, i) => ({
      date: `2023-05-${(i + 1).toString().padStart(2, "0")}`,
      value: Math.floor(Math.random() * 4), // 0-3 intensity
    }))
}
