export type CategoryId = string

export interface WellnessCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  enabled: boolean
  metrics: WellnessMetric[]
}

export interface WellnessMetric {
  id: string
  name: string
  description?: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
  defaultGoal: number
}

export interface WellnessGoal {
  categoryId: string
  metricId: string
  value: number
}

export interface WellnessEntryMetric {
  categoryId: string
  metricId: string
  value: number
}

export interface WellnessEntryData {
  id: string
  date: Date
  metrics: WellnessEntryMetric[]
}

// Helper function to get unit label
export function getUnitLabel(unit: string, value: number): string {
  switch (unit) {
    case "minutes":
      return `${value} mins`
    case "hours":
      return `${value} hrs`
    case "percent":
      return `${value}%`
    case "count":
      return value.toString()
    case "level":
      return value.toString()
    default:
      return value.toString()
  }
}

// Helper function to get stress level label
export function getStressLevelLabel(value: number): string {
  if (value <= 3) return "Low"
  if (value <= 7) return "Moderate"
  return "High"
}

export const getCategoryColorClass = (
  category: { color: string },
  type: "bg" | "text" | "border" | "stroke" | "fill",
): string => {
  return `${type}-${category.color}-500`
}

export interface Activity {
  id: string
  categoryId: string
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  date: string
  duration: number
  value: number
}

export const DEFAULT_CATEGORIES: WellnessCategory[] = [
  {
    id: "faith",
    name: "Faith",
    description: "Activities related to spiritual growth and faith.",
    icon: "Heart",
    color: "green",
    enabled: true,
    metrics: [
      {
        id: "dailyPrayer",
        name: "Daily Prayer",
        description: "Time spent in daily prayer.",
        unit: "minutes",
        min: 0,
        max: 60,
        step: 5,
        defaultValue: 15,
        defaultGoal: 30,
      },
      {
        id: "meditation",
        name: "Meditation",
        description: "Time spent in meditation.",
        unit: "minutes",
        min: 0,
        max: 60,
        step: 5,
        defaultValue: 10,
        defaultGoal: 20,
      },
      {
        id: "scriptureStudy",
        name: "Scripture Study",
        description: "Time spent studying scripture.",
        unit: "minutes",
        min: 0,
        max: 60,
        step: 5,
        defaultValue: 15,
        defaultGoal: 30,
      },
    ],
  },
  {
    id: "life",
    name: "Life",
    description: "Activities related to personal life and relationships.",
    icon: "Users",
    color: "yellow",
    enabled: true,
    metrics: [
      {
        id: "familyTime",
        name: "Family Time",
        description: "Time spent with family.",
        unit: "hours",
        min: 0,
        max: 5,
        step: 0.5,
        defaultValue: 1,
        defaultGoal: 3,
      },
      {
        id: "socialActivities",
        name: "Social Activities",
        description: "Time spent in social activities.",
        unit: "hours",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 2,
        defaultGoal: 6,
      },
      {
        id: "hobbies",
        name: "Hobbies",
        description: "Time spent on hobbies.",
        unit: "hours",
        min: 0,
        max: 8,
        step: 0.5,
        defaultValue: 1,
        defaultGoal: 5,
      },
    ],
  },
  {
    id: "work",
    name: "Work",
    description: "Activities related to work and career.",
    icon: "Briefcase",
    color: "red",
    enabled: true,
    metrics: [
      {
        id: "productivity",
        name: "Productivity",
        description: "Level of productivity at work (1-10).",
        unit: "level",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 5,
        defaultGoal: 7,
      },
      {
        id: "projectsCompleted",
        name: "Projects Completed",
        description: "Number of projects completed.",
        unit: "count",
        min: 0,
        max: 5,
        step: 1,
        defaultValue: 0,
        defaultGoal: 1,
      },
      {
        id: "learningHours",
        name: "Learning Hours",
        description: "Time spent on learning new skills.",
        unit: "hours",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 1,
        defaultGoal: 2,
      },
    ],
  },
  {
    id: "health",
    name: "Health",
    description: "Activities related to physical and mental health.",
    icon: "Heart",
    color: "pink",
    enabled: true,
    metrics: [
      {
        id: "exercise",
        name: "Exercise",
        description: "Time spent exercising.",
        unit: "hours",
        min: 0,
        max: 5,
        step: 0.5,
        defaultValue: 1,
        defaultGoal: 1,
      },
      {
        id: "sleep",
        name: "Sleep",
        description: "Hours of sleep.",
        unit: "hours",
        min: 0,
        max: 12,
        step: 0.5,
        defaultValue: 7,
        defaultGoal: 8,
      },
      {
        id: "stressLevel",
        name: "Stress Level",
        description: "Level of stress (1-5, 1 being lowest).",
        unit: "level",
        min: 1,
        max: 5,
        step: 1,
        defaultValue: 3,
        defaultGoal: 2,
      },
    ],
  },
]
