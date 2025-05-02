/**
 * Time Allocation Algorithm with 7-Hour Daily Cap
 *
 * This utility implements the time allocation algorithm with a 7-hour daily cap
 * for health-conscious time tracking and goal setting.
 */

// Constants
export const DAILY_HOUR_CAP = 7 // Maximum allocatable hours per day
export const BLOCKS_PER_HOUR = 4 // 15-minute blocks per hour
export const DAILY_BLOCK_CAP = DAILY_HOUR_CAP * BLOCKS_PER_HOUR // 28 blocks of 15 minutes
export const DAYS_PER_WEEK = 7
export const DAYS_PER_MONTH = 30 // Approximate

// Types
export interface TimeMetric {
  name: string
  goalTime: number // in hours
  currentTime: number // in hours
  unit?: string
  isInverted?: boolean // For metrics where lower is better (e.g., stress level)
}

export interface TimeCategory {
  id: string
  name: string
  icon: string
  color: string
  metrics: TimeMetric[]
}

export interface TimePeriodData {
  daily: CategoryTimeData[]
  weekly: CategoryTimeData[]
  monthly: CategoryTimeData[]
  total: TotalTimeData
}

export interface CategoryTimeData {
  id: string
  name: string
  icon: string
  color: string
  goalHours: number
  currentHours: number
  progressPercent: number
  metrics: MetricTimeData[]
}

export interface MetricTimeData {
  name: string
  goalHours: number
  currentHours: number
  progressPercent: number
  unit?: string
}

export interface TotalTimeData {
  goalHours: number
  currentHours: number
  progressPercent: number
  overCapacity: boolean
}

/**
 * Calculate progress percentage for a metric
 * @param currentTime Current time spent
 * @param goalTime Goal time
 * @param isInverted Whether lower is better (e.g., stress level)
 * @returns Progress percentage
 */
export function calculateProgress(currentTime: number, goalTime: number, isInverted = false): number {
  if (goalTime <= 0) return 0

  if (isInverted) {
    // For inverted metrics (like stress level), lower is better
    return Math.min(100, Math.max(0, Math.round(((goalTime - currentTime) / goalTime) * 100)))
  }

  return Math.round((currentTime / goalTime) * 100)
}

/**
 * Calculate time data for a category
 * @param category Category with metrics
 * @returns Category time data
 */
export function calculateCategoryTimeData(category: TimeCategory): CategoryTimeData {
  let totalGoalHours = 0
  let totalCurrentHours = 0
  const metricData: MetricTimeData[] = []

  // Calculate metrics data
  category.metrics.forEach((metric) => {
    const progressPercent = calculateProgress(metric.currentTime, metric.goalTime, metric.isInverted)

    totalGoalHours += metric.goalTime
    totalCurrentHours += metric.currentTime

    metricData.push({
      name: metric.name,
      goalHours: metric.goalTime,
      currentHours: metric.currentTime,
      progressPercent,
      unit: metric.unit,
    })
  })

  // Calculate category progress
  const progressPercent = totalGoalHours > 0 ? Math.round((totalCurrentHours / totalGoalHours) * 100) : 0

  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    goalHours: totalGoalHours,
    currentHours: totalCurrentHours,
    progressPercent,
    metrics: metricData,
  }
}

/**
 * Calculate total time data across all categories
 * @param categories Array of category time data
 * @returns Total time data
 */
export function calculateTotalTimeData(categories: CategoryTimeData[]): TotalTimeData {
  let totalGoalHours = 0
  let totalCurrentHours = 0

  categories.forEach((category) => {
    totalGoalHours += category.goalHours
    totalCurrentHours += category.currentHours
  })

  // Cap the goal hours at the daily cap if it exceeds
  const cappedGoalHours = Math.min(totalGoalHours, DAILY_HOUR_CAP)

  // Calculate progress against the 7-hour cap
  const progressPercent = Math.round((totalCurrentHours / DAILY_HOUR_CAP) * 100)

  // Check if over capacity
  const overCapacity = totalCurrentHours > DAILY_HOUR_CAP

  return {
    goalHours: cappedGoalHours,
    currentHours: totalCurrentHours,
    progressPercent,
    overCapacity,
  }
}

/**
 * Scale time data for weekly and monthly views
 * @param dailyData Daily category time data
 * @param scaleFactor Factor to scale by (7 for weekly, 30 for monthly)
 * @returns Scaled category time data
 */
export function scaleTimeData(dailyData: CategoryTimeData, scaleFactor: number): CategoryTimeData {
  const scaledMetrics = dailyData.metrics.map((metric) => ({
    ...metric,
    goalHours: metric.goalHours * scaleFactor,
    currentHours: metric.currentHours * scaleFactor,
    // Progress percentage remains the same
  }))

  return {
    ...dailyData,
    goalHours: dailyData.goalHours * scaleFactor,
    currentHours: dailyData.currentHours * scaleFactor,
    // Progress percentage remains the same
    metrics: scaledMetrics,
  }
}

/**
 * Calculate time data for all time periods (daily, weekly, monthly)
 * @param categories Array of categories with metrics
 * @returns Time period data
 */
export function calculateTimePeriodData(categories: TimeCategory[]): TimePeriodData {
  // Calculate daily data
  const dailyData = categories.map((category) => calculateCategoryTimeData(category))
  const dailyTotal = calculateTotalTimeData(dailyData)

  // Scale to weekly data
  const weeklyData = dailyData.map((data) => scaleTimeData(data, DAYS_PER_WEEK))
  const weeklyTotal = {
    ...dailyTotal,
    goalHours: dailyTotal.goalHours * DAYS_PER_WEEK,
    currentHours: dailyTotal.currentHours * DAYS_PER_WEEK,
  }

  // Scale to monthly data
  const monthlyData = dailyData.map((data) => scaleTimeData(data, DAYS_PER_MONTH))
  const monthlyTotal = {
    ...dailyTotal,
    goalHours: dailyTotal.goalHours * DAYS_PER_MONTH,
    currentHours: dailyTotal.currentHours * DAYS_PER_MONTH,
  }

  return {
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData,
    total: dailyTotal,
  }
}

/**
 * Get time data for a specific time period
 * @param timePeriodData All time period data
 * @param period Time period (daily, weekly, monthly)
 * @returns Category time data for the specified period
 */
export function getTimePeriodData(
  timePeriodData: TimePeriodData,
  period: "daily" | "weekly" | "monthly",
): { categories: CategoryTimeData[]; total: TotalTimeData } {
  return {
    categories: timePeriodData[period],
    total:
      period === "daily"
        ? timePeriodData.total
        : {
            ...timePeriodData.total,
            goalHours: timePeriodData.total.goalHours * (period === "weekly" ? DAYS_PER_WEEK : DAYS_PER_MONTH),
            currentHours: timePeriodData.total.currentHours * (period === "weekly" ? DAYS_PER_WEEK : DAYS_PER_MONTH),
          },
  }
}

/**
 * Format time value with appropriate unit
 * @param hours Time in hours
 * @param unit Optional unit override
 * @returns Formatted time string
 */
export function formatTime(hours: number, unit?: string): string {
  if (unit) {
    return `${hours}${unit}`
  }

  // Convert to appropriate unit
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes}m`
  }

  return `${hours}h`
}

/**
 * Get color class based on progress percentage
 * @param progress Progress percentage
 * @returns Color class
 */
export function getProgressColorClass(progress: number): string {
  if (progress >= 100) return "bg-green-500"
  if (progress >= 75) return "bg-blue-500"
  if (progress >= 50) return "bg-yellow-500"
  if (progress >= 25) return "bg-orange-500"
  return "bg-red-500"
}

/**
 * Get sample time data for demonstration
 * @returns Sample time period data
 */
export function getSampleTimeData(): TimePeriodData {
  const categories: TimeCategory[] = [
    {
      id: "faith",
      name: "Faith",
      icon: "Leaf",
      color: "green",
      metrics: [
        { name: "Daily Prayer", goalTime: 0.5, currentTime: 0.25, unit: "h" },
        { name: "Meditation", goalTime: 0.5, currentTime: 0.125, unit: "h" },
        { name: "Scripture Study", goalTime: 0.5, currentTime: 0.25, unit: "h" },
      ],
    },
    {
      id: "life",
      name: "Life",
      icon: "Home",
      color: "yellow",
      metrics: [
        { name: "Time with Family", goalTime: 2, currentTime: 0.4, unit: "h" },
        { name: "Volunteering", goalTime: 1, currentTime: 0.2, unit: "h" },
        { name: "Hobbies", goalTime: 1, currentTime: 0.6, unit: "h" },
      ],
    },
    {
      id: "work",
      name: "Work",
      icon: "Briefcase",
      color: "red",
      metrics: [
        { name: "Current Reality", goalTime: 4, currentTime: 0.8, unit: "h" },
        { name: "Goal", goalTime: 3, currentTime: 1.2, unit: "h" },
      ],
    },
    {
      id: "health",
      name: "Health",
      icon: "Heart",
      color: "pink",
      metrics: [
        { name: "Exercise", goalTime: 1, currentTime: 0.25, unit: "h" },
        { name: "Sleep", goalTime: 8, currentTime: 2.8, unit: "h" },
        { name: "Stress Level", goalTime: 10, currentTime: 5, isInverted: true },
      ],
    },
  ]

  return calculateTimePeriodData(categories)
}
