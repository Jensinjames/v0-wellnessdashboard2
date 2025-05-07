export interface GoalCategory {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  user_id: string
  created_at: string
  updated_at: string
  daily_time_allocation: number // in hours
  subcategories?: GoalSubcategory[]
  total_progress?: number // calculated field
}

export interface GoalSubcategory {
  id: string
  name: string
  description?: string
  category_id: string
  user_id: string
  created_at: string
  updated_at: string
  daily_time_allocation: number // in hours
  goals?: Goal[]
  total_progress?: number // calculated field
}

export interface Goal {
  id: string
  name: string
  description?: string
  notes?: string // private notes not shown in graphs
  subcategory_id: string
  user_id: string
  created_at: string
  updated_at: string
  daily_time_allocation: number // in hours
  progress: number // 0-100
  status: "not_started" | "in_progress" | "completed" | "on_hold"
  priority: "low" | "medium" | "high"
  due_date?: string
}

export interface TimeEntry {
  id: string
  goal_id: string
  user_id: string
  duration: number // in hours
  date: string
  notes?: string
  created_at: string
}

// For the drag and drop functionality
export type DraggableItemType = "category" | "subcategory" | "goal"

export interface DraggableItem {
  id: string
  type: DraggableItemType
  parentId?: string
}
