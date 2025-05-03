import type React from "react"

// Main component props
export interface CategoryOverviewProps {
  showGoals?: boolean
  showTimeAllocations?: boolean
  showSubcategoryProgress?: boolean
  interactive?: boolean
  maxCategories?: number
  comparisonMode?: boolean
}

// Subcategory data structure
export interface SubcategoryProgress {
  id: string
  name: string
  progress: number
  current: number
  goal: number
  unit: string
}

// Category data structure with processed metrics
export interface CategoryProgressData {
  id: string
  name: string
  icon: string
  color: string
  progress: number
  subcategories: SubcategoryProgress[]
  totalGoal: number
  totalTime: number
  totalActivities: number
  efficiency: number
  totalCurrentValue: number
  goalAchievement: number
}

// Trend indicator return type
export type TrendIndicator = {
  icon: {
    type: React.ComponentType<any>
    props: {
      className: string
    }
  }
  color: string
}

// Comparison data structure
export interface ComparisonData {
  name: string
  value: number
  color: string
  average: number
  goal?: number
}

// Goal comparison data structure
export interface GoalComparisonData {
  name: string
  current: number
  goal: number
  achievement: number
  color: string
  gap: number
}

// Valid comparison metrics
export type ComparisonMetric = "progress" | "time" | "efficiency" | "goalAchievement"

// Badge variant type
export type BadgeVariantType = "default" | "secondary" | "destructive" | "outline" | "success"
