export interface GoalCategory {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  user_id: string
  created_at: string
  updated_at: string
  daily_time_allocation: number
  subcategories?: GoalSubcategory[]
}

export interface GoalSubcategory {
  id: string
  name: string
  description?: string
  category_id: string
  user_id: string
  created_at: string
  updated_at: string
  daily_time_allocation: number
  goals?: Goal[]
}

export interface Goal {
  id: string
  name: string
  description?: string
  notes?: string
  subcategory_id: string
  user_id: string
  created_at: string
  updated_at: string
  daily_time_allocation: number
  progress: number
  status: "not_started" | "in_progress" | "completed" | "on_hold"
  priority: "low" | "medium" | "high"
  due_date?: string
}

export interface TimeEntry {
  id: string
  goal_id: string
  user_id: string
  duration: number
  date: string
  notes?: string
  created_at: string
}

export interface GoalHierarchy {
  categories: GoalCategory[]
  subcategories: GoalSubcategory[]
  goals: Goal[]
  timeEntries: TimeEntry[]
}

export type Category = GoalCategory
export type Subcategory = GoalSubcategory
