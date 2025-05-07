"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { GoalCategory, GoalSubcategory, Goal, TimeEntry } from "@/types/goals-hierarchy"
import { useSupabase } from "@/hooks/use-supabase"

interface GoalHierarchyData {
  categories: GoalCategory[]
  isLoading: boolean
  error: string | null
  totalDailyTimeAllocation: number
  createCategory: (category: Partial<GoalCategory>) => Promise<{ success: boolean; id?: string; error?: string }>
  updateCategory: (categoryId: string, updates: Partial<GoalCategory>) => Promise<{ success: boolean; error?: string }>
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>
  createSubcategory: (
    subcategory: Partial<GoalSubcategory>,
  ) => Promise<{ success: boolean; id?: string; error?: string }>
  updateSubcategory: (
    subcategoryId: string,
    updates: Partial<GoalSubcategory>,
  ) => Promise<{ success: boolean; error?: string }>
  deleteSubcategory: (subcategoryId: string) => Promise<{ success: boolean; error?: string }>
  createGoal: (goal: Partial<Goal>) => Promise<{ success: boolean; id?: string; error?: string }>
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<{ success: boolean; error?: string }>
  deleteGoal: (goalId: string) => Promise<{ success: boolean; error?: string }>
  moveGoal: (goalId: string, newSubcategoryId: string) => Promise<{ success: boolean; error?: string }>
  moveSubcategory: (subcategoryId: string, newCategoryId: string) => Promise<{ success: boolean; error?: string }>
  addTimeEntry: (entry: Partial<TimeEntry>) => Promise<{ success: boolean; id?: string; error?: string }>
  refetch: () => Promise<void>
}

export function useGoalHierarchy(): GoalHierarchyData {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [categories, setCategories] = useState<GoalCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoalHierarchy = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("goal_categories")
        .select(`
          *,
          subcategories:goal_subcategories(
            *,
            goals:goals(*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at")

      if (error) {
        throw error
      }

      setCategories(data || [])
    } catch (err: any) {
      console.error("Error fetching goal hierarchy:", err)
      setError(err.message || "Failed to load goal data")
      toast({
        title: "Error",
        description: "Failed to load your goals. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase, toast])

  useEffect(() => {
    fetchGoalHierarchy()
  }, [fetchGoalHierarchy])

  const createCategory = async (category: Partial<GoalCategory>) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { data, error } = await supabase
        .from("goal_categories")
        .insert({
          name: category.name,
          description: category.description || "",
          color: category.color || "#4f46e5",
          icon: category.icon || "",
          user_id: user.id,
          daily_time_allocation: category.daily_time_allocation || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Category created successfully",
      })

      return { success: true, id: data.id }
    } catch (err: any) {
      console.error("Error creating category:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create category",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const updateCategory = async (categoryId: string, updates: Partial<GoalCategory>) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { error } = await supabase
        .from("goal_categories")
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          icon: updates.icon,
          daily_time_allocation: updates.daily_time_allocation,
          updated_at: new Date().toISOString(),
        })
        .eq("id", categoryId)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Category updated successfully",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Error updating category:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update category",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { error } = await supabase.from("goal_categories").delete().eq("id", categoryId).eq("user_id", user.id)

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Error deleting category:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete category",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const createSubcategory = async (subcategory: Partial<GoalSubcategory>) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { data, error } = await supabase
        .from("goal_subcategories")
        .insert({
          name: subcategory.name,
          description: subcategory.description || "",
          category_id: subcategory.category_id,
          user_id: user.id,
          daily_time_allocation: subcategory.daily_time_allocation || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Subcategory created successfully",
      })

      return { success: true, id: data.id }
    } catch (err: any) {
      console.error("Error creating subcategory:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create subcategory",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const updateSubcategory = async (subcategoryId: string, updates: Partial<GoalSubcategory>) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { error } = await supabase
        .from("goal_subcategories")
        .update({
          name: updates.name,
          description: updates.description,
          category_id: updates.category_id,
          daily_time_allocation: updates.daily_time_allocation,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subcategoryId)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Subcategory updated successfully",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Error updating subcategory:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update subcategory",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const deleteSubcategory = async (subcategoryId: string) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { error } = await supabase
        .from("goal_subcategories")
        .delete()
        .eq("id", subcategoryId)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Subcategory deleted successfully",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Error deleting subcategory:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete subcategory",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const createGoal = async (goal: Partial<Goal>) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          name: goal.name,
          description: goal.description || "",
          notes: goal.notes || "",
          subcategory_id: goal.subcategory_id,
          user_id: user.id,
          daily_time_allocation: goal.daily_time_allocation || 0,
          progress: goal.progress || 0,
          status: goal.status || "not_started",
          priority: goal.priority || "medium",
          due_date: goal.due_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Goal created successfully",
      })

      return { success: true, id: data.id }
    } catch (err: any) {
      console.error("Error creating goal:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create goal",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { error } = await supabase
        .from("goals")
        .update({
          name: updates.name,
          description: updates.description,
          notes: updates.notes,
          subcategory_id: updates.subcategory_id,
          daily_time_allocation: updates.daily_time_allocation,
          progress: updates.progress,
          status: updates.status,
          priority: updates.priority,
          due_date: updates.due_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Goal updated successfully",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Error updating goal:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update goal",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { error } = await supabase.from("goals").delete().eq("id", goalId).eq("user_id", user.id)

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Error deleting goal:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete goal",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const moveGoal = async (goalId: string, newSubcategoryId: string) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { error } = await supabase
        .from("goals")
        .update({
          subcategory_id: newSubcategoryId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Goal moved successfully",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Error moving goal:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to move goal",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const moveSubcategory = async (subcategoryId: string, newCategoryId: string) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { error } = await supabase
        .from("goal_subcategories")
        .update({
          category_id: newCategoryId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subcategoryId)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Subcategory moved successfully",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Error moving subcategory:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to move subcategory",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  const addTimeEntry = async (entry: Partial<TimeEntry>) => {
    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    try {
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          goal_id: entry.goal_id,
          user_id: user.id,
          duration: entry.duration,
          date: entry.date || new Date().toISOString().split("T")[0],
          notes: entry.notes || "",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        throw error
      }

      await fetchGoalHierarchy()
      toast({
        title: "Success",
        description: "Time entry added successfully",
      })

      return { success: true, id: data.id }
    } catch (err: any) {
      console.error("Error adding time entry:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to add time entry",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    }
  }

  // Calculate total daily time allocation across all categories
  const totalDailyTimeAllocation = categories.reduce((total, category) => {
    return total + (category.daily_time_allocation || 0)
  }, 0)

  return {
    categories,
    isLoading,
    error,
    totalDailyTimeAllocation,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    createGoal,
    updateGoal,
    deleteGoal,
    moveGoal,
    moveSubcategory,
    addTimeEntry,
    refetch: fetchGoalHierarchy,
  }
}
