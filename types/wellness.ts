// Define the structure for wellness categories and metrics
export type CategoryId = "faith" | "life" | "work" | "health" | "mindfulness" | "learning" | "relationships" | string // Allow for custom categories

// Define the structure for a metric within a category
export interface WellnessMetric {
  id: string
  name: string
  description: string
  unit: "minutes" | "hours" | "percent" | "count" | "level" | string
  min: number
  max: number
  step: number
  defaultValue: number
  defaultGoal: number
}

// Define the structure for a wellness category
export interface WellnessCategory {
  id: CategoryId
  name: string
  description: string
  icon: string // Icon name from Lucide icons
  color: string // Tailwind color class
  metrics: WellnessMetric[]
  enabled: boolean
}

// Define the structure for a wellness goal
export interface WellnessGoal {
  categoryId: CategoryId
  metricId: string
  value: number
}

// Define the structure for a wellness entry metric value
export interface WellnessEntryMetric {
  categoryId: CategoryId
  metricId: string
  value: number
}

// Define the structure for a wellness entry
export interface WellnessEntryData {
  id: string
  date: Date
  metrics: WellnessEntryMetric[]
}

// Define the default categories and metrics
export const DEFAULT_CATEGORIES: WellnessCategory[] = [
  {
    id: "faith",
    name: "Faith",
    description: "Spiritual practices and mindfulness activities",
    icon: "Leaf",
    color: "green",
    enabled: true,
    metrics: [
      {
        id: "dailyPrayer",
        name: "Daily Prayer",
        description: "Time spent in prayer each day",
        unit: "minutes",
        min: 0,
        max: 120,
        step: 5,
        defaultValue: 0,
        defaultGoal: 30,
      },
      {
        id: "meditation",
        name: "Meditation",
        description: "Time spent in meditation each day",
        unit: "minutes",
        min: 0,
        max: 120,
        step: 5,
        defaultValue: 0,
        defaultGoal: 20,
      },
      {
        id: "scriptureStudy",
        name: "Scripture Study",
        description: "Time spent studying scripture each day",
        unit: "minutes",
        min: 0,
        max: 120,
        step: 5,
        defaultValue: 0,
        defaultGoal: 30,
      },
    ],
  },
  {
    id: "life",
    name: "Life",
    description: "Work-life balance and relationships",
    icon: "Sun",
    color: "yellow",
    enabled: true,
    metrics: [
      {
        id: "familyTime",
        name: "Family Time",
        description: "Time spent with family each day",
        unit: "hours",
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 0,
        defaultGoal: 3,
      },
      {
        id: "socialActivities",
        name: "Social Activities",
        description: "Time spent on social activities each week",
        unit: "hours",
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 0,
        defaultGoal: 6,
      },
      {
        id: "hobbies",
        name: "Hobbies",
        description: "Time spent on hobbies each week",
        unit: "hours",
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 0,
        defaultGoal: 5,
      },
    ],
  },
  {
    id: "work",
    name: "Work",
    description: "Career and professional development",
    icon: "Briefcase",
    color: "red",
    enabled: true,
    metrics: [
      {
        id: "productivity",
        name: "Productivity",
        description: "Self-assessed productivity level",
        unit: "percent",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 0,
        defaultGoal: 80,
      },
      {
        id: "projectsCompleted",
        name: "Projects Completed",
        description: "Number of projects completed each week",
        unit: "count",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 0,
        defaultGoal: 3,
      },
      {
        id: "learningHours",
        name: "Learning Hours",
        description: "Time spent on professional learning each week",
        unit: "hours",
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 0,
        defaultGoal: 2,
      },
    ],
  },
  {
    id: "health",
    name: "Health",
    description: "Physical and mental wellbeing",
    icon: "Heart",
    color: "pink",
    enabled: true,
    metrics: [
      {
        id: "exercise",
        name: "Exercise",
        description: "Time spent exercising each week",
        unit: "hours",
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 0,
        defaultGoal: 5,
      },
      {
        id: "sleep",
        name: "Sleep",
        description: "Hours of sleep each night",
        unit: "hours",
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 0,
        defaultGoal: 8,
      },
      {
        id: "stressLevel",
        name: "Stress Level",
        description: "Self-assessed stress level (lower is better)",
        unit: "level",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 5,
        defaultGoal: 3,
      },
    ],
  },
  {
    id: "mindfulness",
    name: "Mindfulness",
    description: "Awareness and presence practices",
    icon: "Brain",
    color: "green",
    enabled: true,
    metrics: [
      {
        id: "mindfulnessMinutes",
        name: "Mindfulness Minutes",
        description: "Time spent practicing mindfulness each day",
        unit: "minutes",
        min: 0,
        max: 120,
        step: 5,
        defaultValue: 0,
        defaultGoal: 30,
      },
    ],
  },
  {
    id: "learning",
    name: "Learning",
    description: "Personal growth and education",
    icon: "BookOpen",
    color: "blue",
    enabled: true,
    metrics: [
      {
        id: "readingTime",
        name: "Reading Time",
        description: "Time spent reading each day",
        unit: "hours",
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 0,
        defaultGoal: 1,
      },
    ],
  },
  {
    id: "relationships",
    name: "Relationships",
    description: "Connections with others",
    icon: "Users",
    color: "purple",
    enabled: true,
    metrics: [
      {
        id: "connectionTime",
        name: "Connection Time",
        description: "Time spent connecting with others each day",
        unit: "hours",
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 0,
        defaultGoal: 2,
      },
    ],
  },
]

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

// Add this helper function to get color class based on category
export function getCategoryColorClass(
  category: WellnessCategory,
  type: "bg" | "text" | "border" | "stroke" | "fill",
): string {
  return `${type}-${category.color}-600`
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
