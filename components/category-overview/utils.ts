import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"
import type { TrendIndicator } from "./types"

// Constants
export const DEFAULT_MAX_CATEGORIES = 4
export const MOBILE_BREAKPOINT = 768

// Calculate progress percentage with safety checks
export const calculateProgress = (current: number, goal: number): number => {
  return goal > 0 ? Math.min(100, (current / goal) * 100) : 0
}

// Format time display
export const formatTime = (time: number): string => {
  if (time < 1) {
    return `${Math.round(time * 60)}m`
  }
  return `${time.toFixed(1)}h`
}

// Format value with unit
export const formatValue = (value: number, unit: string): string => {
  switch (unit) {
    case "minutes":
      return `${value}m`
    case "hours":
      return `${value}h`
    case "percent":
      return `${value}%`
    case "level":
      return `Level ${value}`
    default:
      return value.toString()
  }
}

// Get trend indicator based on value compared to goal
export const getTrendIndicator = (current: number, goal: number): TrendIndicator => {
  const percentage = goal > 0 ? (current / goal) * 100 : 0
  if (percentage >= 100) {
    return {
      icon: { type: ArrowUpIcon, props: { className: "h-4 w-4 text-green-500" } },
      color: "text-green-500",
    }
  } else if (percentage >= 75) {
    return {
      icon: { type: ArrowUpIcon, props: { className: "h-4 w-4 text-amber-500" } },
      color: "text-amber-500",
    }
  } else if (percentage >= 50) {
    return {
      icon: { type: MinusIcon, props: { className: "h-4 w-4 text-amber-500" } },
      color: "text-amber-500",
    }
  } else {
    return {
      icon: { type: ArrowDownIcon, props: { className: "h-4 w-4 text-red-500" } },
      color: "text-red-500",
    }
  }
}

// Get comparison metric label
export const getComparisonMetricLabel = (metric: string): string => {
  switch (metric) {
    case "progress":
      return "Progress (%)"
    case "time":
      return "Time Spent (hours)"
    case "efficiency":
      return "Efficiency (progress/hour)"
    case "goalAchievement":
      return "Goal Achievement (%)"
    default:
      return ""
  }
}

// Calculate average for a specific property across an array of objects
export const calculateAverage = <T extends Record<string, any>>(items: T[], property: keyof T): number => {
  if (items.length === 0) return 0
  return items.reduce((sum, item) => sum + (item[property] as number), 0) / items.length
}
