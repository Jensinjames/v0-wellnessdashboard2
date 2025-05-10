import { categoryColors } from "@/utils/chart-utils"

export type CategoryType = "faith" | "life" | "work" | "health"

export interface CategoryGoal {
  id: string
  category: CategoryType
  name: string
  goal_hours: number
  color: string
}

export const defaultGoals: CategoryGoal[] = [
  {
    id: "faith",
    category: "faith",
    name: "Faith",
    goal_hours: 1.5,
    color: categoryColors.faith.primary,
  },
  {
    id: "life",
    category: "life",
    name: "Life",
    goal_hours: 4,
    color: categoryColors.life.primary,
  },
  {
    id: "work",
    category: "work",
    name: "Work",
    goal_hours: 7,
    color: categoryColors.work.primary,
  },
  {
    id: "health",
    category: "health",
    name: "Health",
    goal_hours: 19,
    color: categoryColors.health.primary,
  },
]

export interface CategoryActivity {
  id: string
  name: string
  category: CategoryType
  description?: string
  defaultDuration?: number
}

export const defaultActivities: Record<CategoryType, CategoryActivity[]> = {
  faith: [
    { id: "prayer", name: "Prayer", category: "faith", defaultDuration: 0.25 },
    { id: "meditation", name: "Meditation", category: "faith", defaultDuration: 0.5 },
    { id: "scripture", name: "Scripture Study", category: "faith", defaultDuration: 0.5 },
  ],
  life: [
    { id: "family", name: "Family Time", category: "life", defaultDuration: 1 },
    { id: "social", name: "Social Activities", category: "life", defaultDuration: 2 },
    { id: "hobbies", name: "Hobbies", category: "life", defaultDuration: 1 },
  ],
  work: [
    { id: "focused", name: "Focused Work", category: "work", defaultDuration: 4 },
    { id: "meetings", name: "Meetings", category: "work", defaultDuration: 2 },
    { id: "learning", name: "Professional Learning", category: "work", defaultDuration: 1 },
  ],
  health: [
    { id: "exercise", name: "Exercise", category: "health", defaultDuration: 1 },
    { id: "sleep", name: "Sleep", category: "health", defaultDuration: 8 },
    { id: "nutrition", name: "Healthy Eating", category: "health", defaultDuration: 0.5 },
    { id: "mental", name: "Mental Health", category: "health", defaultDuration: 0.5 },
  ],
}

export interface WellnessEntry {
  id: string
  category: string
  activity: string
  duration: number
  notes?: string
  timestamp: string
  created_at: string
  metadata?: Record<string, any>
}

export interface WellnessGoal {
  id: string
  category: string
  goal_hours: number
  created_at: string
  updated_at: string
}

export interface WellnessCategory {
  id: string
  name: string
  color: string
  icon?: string | null
  user_id?: string | null
  created_at?: string
  updated_at?: string
}
