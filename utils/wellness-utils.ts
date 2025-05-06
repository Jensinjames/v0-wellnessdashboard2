import type { WellnessCategory, WellnessEntry, WellnessGoal } from "@/types/supabase"

export interface CategorySummary {
  id: string
  name: string
  color: string
  icon: string | null
  minutesSpent: number
  targetMinutes: number
  percentComplete: number
}

export interface DailySummary {
  totalMinutesSpent: number
  totalTargetMinutes: number
  percentComplete: number
  categories: CategorySummary[]
}

export function calculateCategorySummary(
  category: WellnessCategory,
  entries: WellnessEntry[],
  goals: WellnessGoal[],
): CategorySummary {
  // Filter entries for this category
  const categoryEntries = entries.filter((entry) => entry.category_id === category.id)

  // Calculate total minutes spent
  const minutesSpent = categoryEntries.reduce((total, entry) => total + entry.minutes_spent, 0)

  // Find the goal for this category
  const categoryGoal = goals.find((goal) => goal.category_id === category.id && goal.activity_id === null)
  const targetMinutes = categoryGoal?.target_minutes || 0

  // Calculate percent complete
  const percentComplete = targetMinutes > 0 ? Math.min(100, Math.round((minutesSpent / targetMinutes) * 100)) : 0

  return {
    id: category.id,
    name: category.name,
    color: category.color || "#94a3b8", // Default to slate-400 if no color
    icon: category.icon,
    minutesSpent,
    targetMinutes,
    percentComplete,
  }
}

export function calculateDailySummary(
  categories: WellnessCategory[],
  entries: WellnessEntry[],
  goals: WellnessGoal[],
): DailySummary {
  // Calculate summary for each category
  const categorySummaries = categories.map((category) => calculateCategorySummary(category, entries, goals))

  // Calculate totals
  const totalMinutesSpent = categorySummaries.reduce((total, summary) => total + summary.minutesSpent, 0)
  const totalTargetMinutes = categorySummaries.reduce((total, summary) => total + summary.targetMinutes, 0)
  const percentComplete =
    totalTargetMinutes > 0 ? Math.min(100, Math.round((totalMinutesSpent / totalTargetMinutes) * 100)) : 0

  return {
    totalMinutesSpent,
    totalTargetMinutes,
    percentComplete,
    categories: categorySummaries,
  }
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? "s" : ""}`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`
  }

  return `${hours} hour${hours !== 1 ? "s" : ""} ${remainingMinutes} min${remainingMinutes !== 1 ? "s" : ""}`
}

export function getCategoryColor(categoryName: string): string {
  const colors: Record<string, string> = {
    Faith: "#8b5cf6", // violet-500
    Life: "#3b82f6", // blue-500
    Work: "#ef4444", // red-500
    Health: "#10b981", // emerald-500
  }

  return colors[categoryName] || "#94a3b8" // Default to slate-400
}

export function getCategoryIcon(categoryName: string): string {
  const icons: Record<string, string> = {
    Faith: "heart",
    Life: "users",
    Work: "briefcase",
    Health: "activity",
  }

  return icons[categoryName] || "circle"
}
