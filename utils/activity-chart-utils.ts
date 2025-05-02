import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
} from "date-fns"

// Define the activity data structure
export interface Activity {
  id: string
  categoryId: string
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  date: Date | string
  duration: number
  value: number
  notes?: string
}

// Process activities for time-based charts (daily, weekly, monthly)
export function getActivityTimeData(
  activities: Activity[],
  timeFrame: "daily" | "weekly" | "monthly",
  daysToShow = 14,
) {
  const now = new Date()
  const result: any[] = []

  if (timeFrame === "daily") {
    // Daily view - show last X days
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayActivities = activities.filter((activity) => {
        const activityDate = typeof activity.date === "string" ? parseISO(activity.date) : activity.date
        return isWithinInterval(activityDate, { start: dayStart, end: dayEnd })
      })

      result.push({
        date: format(date, "MMM dd"),
        count: dayActivities.length,
        totalDuration: dayActivities.reduce((sum, act) => sum + act.duration, 0),
        totalValue: dayActivities.reduce((sum, act) => sum + act.value, 0),
        avgValue: dayActivities.length
          ? Math.round(dayActivities.reduce((sum, act) => sum + act.value, 0) / dayActivities.length)
          : 0,
      })
    }
  } else if (timeFrame === "weekly") {
    // Weekly view - show last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i))
      const weekEnd = endOfWeek(subWeeks(now, i))

      const weekActivities = activities.filter((activity) => {
        const activityDate = typeof activity.date === "string" ? parseISO(activity.date) : activity.date
        return isWithinInterval(activityDate, { start: weekStart, end: weekEnd })
      })

      result.push({
        date: `${format(weekStart, "MMM dd")} - ${format(weekEnd, "MMM dd")}`,
        count: weekActivities.length,
        totalDuration: weekActivities.reduce((sum, act) => sum + act.duration, 0),
        totalValue: weekActivities.reduce((sum, act) => sum + act.value, 0),
        avgValue: weekActivities.length
          ? Math.round(weekActivities.reduce((sum, act) => sum + act.value, 0) / weekActivities.length)
          : 0,
      })
    }
  } else {
    // Monthly view - show last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(now.getMonth() - i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      const monthActivities = activities.filter((activity) => {
        const activityDate = typeof activity.date === "string" ? parseISO(activity.date) : activity.date
        return isWithinInterval(activityDate, { start: monthStart, end: monthEnd })
      })

      result.push({
        date: format(date, "MMM yyyy"),
        count: monthActivities.length,
        totalDuration: monthActivities.reduce((sum, act) => sum + act.duration, 0),
        totalValue: monthActivities.reduce((sum, act) => sum + act.value, 0),
        avgValue: monthActivities.length
          ? Math.round(monthActivities.reduce((sum, act) => sum + act.value, 0) / monthActivities.length)
          : 0,
      })
    }
  }

  return result
}

// Get category distribution data
export function getCategoryDistribution(activities: Activity[]) {
  const categoryMap = new Map<string, { count: number; totalDuration: number; totalValue: number }>()

  activities.forEach((activity) => {
    if (!categoryMap.has(activity.categoryName)) {
      categoryMap.set(activity.categoryName, { count: 0, totalDuration: 0, totalValue: 0 })
    }

    const categoryData = categoryMap.get(activity.categoryName)!
    categoryData.count += 1
    categoryData.totalDuration += activity.duration
    categoryData.totalValue += activity.value
  })

  return Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    totalDuration: data.duration,
    totalValue: data.totalValue,
    avgValue: Math.round(data.totalValue / data.count),
  }))
}

// Get time of day distribution
export function getTimeOfDayDistribution(activities: Activity[]) {
  const timeSlots = [
    { name: "Morning (5am-12pm)", count: 0, slot: [5, 11] },
    { name: "Afternoon (12pm-5pm)", count: 0, slot: [12, 16] },
    { name: "Evening (5pm-9pm)", count: 0, slot: [17, 20] },
    { name: "Night (9pm-5am)", count: 0, slot: [21, 4] },
  ]

  activities.forEach((activity) => {
    const activityDate = typeof activity.date === "string" ? parseISO(activity.date) : activity.date
    const hour = activityDate.getHours()

    for (const slot of timeSlots) {
      if (slot.slot[0] <= slot.slot[1]) {
        // Normal range (e.g., 5-11)
        if (hour >= slot.slot[0] && hour <= slot.slot[1]) {
          slot.count += 1
          break
        }
      } else {
        // Wrapped range (e.g., 21-4)
        if (hour >= slot.slot[0] || hour <= slot.slot[1]) {
          slot.count += 1
          break
        }
      }
    }
  })

  return timeSlots
}

// Get streak data (consecutive days with activities)
export function getStreakData(activities: Activity[]) {
  if (!activities.length) return { currentStreak: 0, longestStreak: 0, streakDates: [] }

  // Sort activities by date
  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = typeof a.date === "string" ? parseISO(a.date) : a.date
    const dateB = typeof b.date === "string" ? parseISO(b.date) : b.date
    return dateA.getTime() - dateB.getTime()
  })

  // Get unique dates with activities
  const uniqueDates = new Set<string>()
  sortedActivities.forEach((activity) => {
    const activityDate = typeof activity.date === "string" ? parseISO(activity.date) : activity.date
    uniqueDates.add(format(activityDate, "yyyy-MM-dd"))
  })

  const dateArray = Array.from(uniqueDates).map((dateStr) => parseISO(dateStr))
  dateArray.sort((a, b) => a.getTime() - b.getTime())

  // Calculate streaks
  let currentStreak = 0
  let longestStreak = 0
  let streakDates: Date[] = []
  let currentStreakDates: Date[] = []

  for (let i = 0; i < dateArray.length; i++) {
    if (i === 0) {
      currentStreak = 1
      currentStreakDates = [dateArray[i]]
    } else {
      const prevDate = dateArray[i - 1]
      const currDate = dateArray[i]
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day
        currentStreak += 1
        currentStreakDates.push(currDate)
      } else {
        // Streak broken
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
          streakDates = [...currentStreakDates]
        }
        currentStreak = 1
        currentStreakDates = [currDate]
      }
    }
  }

  // Check if current streak is the longest
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak
    streakDates = [...currentStreakDates]
  }

  // Check if the current streak is still active (includes today)
  const today = format(new Date(), "yyyy-MM-dd")
  const lastActivityDate = format(dateArray[dateArray.length - 1], "yyyy-MM-dd")
  const isCurrentStreakActive = today === lastActivityDate

  return {
    currentStreak: isCurrentStreakActive ? currentStreak : 0,
    longestStreak,
    streakDates,
  }
}

// Get heatmap data for calendar view
export function getHeatmapData(activities: Activity[], daysToShow = 90) {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - daysToShow)

  const dateRange = eachDayOfInterval({ start: startDate, end: now })

  return dateRange.map((date) => {
    const dayActivities = activities.filter((activity) => {
      const activityDate = typeof activity.date === "string" ? parseISO(activity.date) : activity.date
      return isSameDay(activityDate, date)
    })

    return {
      date,
      count: dayActivities.length,
      value: dayActivities.reduce((sum, act) => sum + act.value, 0),
      intensity: Math.min(4, Math.floor(dayActivities.length / 2)), // 0-4 intensity levels
    }
  })
}

// Get activity correlation data (e.g., duration vs. value)
export function getCorrelationData(activities: Activity[]) {
  return activities.map((activity) => ({
    duration: activity.duration,
    value: activity.value,
    category: activity.categoryName,
    date:
      typeof activity.date === "string" ? format(parseISO(activity.date), "MMM dd") : format(activity.date, "MMM dd"),
  }))
}
