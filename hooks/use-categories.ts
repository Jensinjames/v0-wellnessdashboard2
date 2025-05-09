"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "./use-supabase"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { WellnessCategory } from "@/app/actions/categories"
import { CACHE_EXPIRY } from "@/lib/query-cache"

export function useCategories() {
  const { user } = useAuth()
  const { read, write, isOnline } = useSupabase()
  const { toast } = useToast()
  const [categories, setCategories] = useState<WellnessCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories with selective columns
  const fetchCategories = useCallback(
    async (refresh = false) => {
      if (!user) {
        setError("You must be logged in to view categories")
        setIsLoading(false)
        return []
      }

      setIsLoading(true)
      setError(null)

      try {
        const data = await read<WellnessCategory[]>(
          "wellness_categories",
          (query) => query.or(`user_id.is.null,user_id.eq.${user.id}`).order("name"),
          {
            columns: ["id", "name", "color", "icon", "user_id", "created_at", "updated_at"],
            cacheKey: `categories:${user.id}`,
            cacheTTL: CACHE_EXPIRY.MEDIUM,
            bypassCache: refresh,
            requiresAuth: true,
          },
        )

        setCategories(data || [])
        return data || []
      } catch (err: any) {
        console.error("Error fetching categories:", err)
        setError(err.message || "Failed to load categories")

        if (!isOnline) {
          toast({
            title: "Offline Mode",
            description: "Using cached categories. Some features may be limited.",
            variant: "warning",
          })
        }

        return []
      } finally {
        setIsLoading(false)
      }
    },
    [user, read, isOnline, toast],
  )

  // Create a new category
  const createCategory = useCallback(
    async (category: Omit<WellnessCategory, "id" | "created_at" | "updated_at">) => {
      if (!user) {
        return { success: false, error: "You must be logged in" }
      }

      try {
        // Check if a category with this name already exists
        const existingCategories = await read<WellnessCategory[]>(
          "wellness_categories",
          (query) => query.or(`user_id.is.null,user_id.eq.${user.id}`).eq("name", category.name).limit(1),
          {
            columns: ["id"],
            cacheKey: `category:check:${category.name}`,
            bypassCache: true,
          },
        )

        if (existingCategories && existingCategories.length > 0) {
          return {
            success: false,
            error: `A category named "${category.name}" already exists`,
          }
        }

        // Create new category
        const newCategory = {
          ...category,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const result = await write<{ id: string }>(
          "wellness_categories",
          "insert",
          newCategory,
          (query) => query.select("id").single(),
          {
            requiresAuth: true,
          },
        )

        // Refresh categories
        await fetchCategories(true)

        return { success: true, id: result.id }
      } catch (error: any) {
        console.error("Error creating category:", error)
        return { success: false, error: error.message || "An unexpected error occurred" }
      }
    },
    [user, read, write, fetchCategories],
  )

  // Update an existing category
  const updateCategory = useCallback(
    async (categoryId: string, updates: Partial<WellnessCategory>) => {
      if (!user) {
        return { success: false, error: "You must be logged in" }
      }

      try {
        // First check if this is a system category (no user_id)
        const category = await read<{ user_id: string | null }>(
          "wellness_categories",
          (query) => query.eq("id", categoryId).single(),
          {
            columns: ["user_id"],
            bypassCache: true,
          },
        )

        // If it's a system category, don't allow updates
        if (!category.user_id) {
          return {
            success: false,
            error: "System categories cannot be modified",
          }
        }

        // If it's not the user's category, don't allow updates
        if (category.user_id !== user.id) {
          return {
            success: false,
            error: "You can only modify your own categories",
          }
        }

        // Check if name is being updated and if it would conflict
        if (updates.name) {
          const existingCategory = await read<{ id: string } | null>(
            "wellness_categories",
            (query) =>
              query
                .or(`user_id.is.null,user_id.eq.${user.id}`)
                .eq("name", updates.name)
                .neq("id", categoryId)
                .limit(1)
                .maybeSingle(),
            {
              columns: ["id"],
              bypassCache: true,
            },
          )

          if (existingCategory) {
            return {
              success: false,
              error: `A category named "${updates.name}" already exists`,
            }
          }
        }

        // Update the category
        await write(
          "wellness_categories",
          "update",
          {
            ...updates,
            updated_at: new Date().toISOString(),
          },
          (query) => query.eq("id", categoryId),
          {
            requiresAuth: true,
          },
        )

        // Refresh categories
        await fetchCategories(true)

        return { success: true }
      } catch (error: any) {
        console.error("Error updating category:", error)
        return { success: false, error: error.message || "An unexpected error occurred" }
      }
    },
    [user, read, write, fetchCategories],
  )

  // Delete a category
  const deleteCategory = useCallback(
    async (categoryId: string) => {
      if (!user) {
        return { success: false, error: "You must be logged in" }
      }

      try {
        // First check if this is a system category (no user_id)
        const category = await read<{ user_id: string | null }>(
          "wellness_categories",
          (query) => query.eq("id", categoryId).single(),
          {
            columns: ["user_id"],
            bypassCache: true,
          },
        )

        // If it's a system category, don't allow deletion
        if (!category.user_id) {
          return {
            success: false,
            error: "System categories cannot be deleted",
          }
        }

        // If it's not the user's category, don't allow deletion
        if (category.user_id !== user.id) {
          return {
            success: false,
            error: "You can only delete your own categories",
          }
        }

        // Check if there are any goals or entries using this category
        const goalCount = await read<number>("wellness_goals", (query) => query.eq("category", categoryId).count(), {
          bypassCache: true,
        })

        if (goalCount > 0) {
          return {
            success: false,
            error: "This category is being used in goals and cannot be deleted",
          }
        }

        // Delete the category
        await write("wellness_categories", "delete", null, (query) => query.eq("id", categoryId), {
          requiresAuth: true,
        })

        // Refresh categories
        await fetchCategories(true)

        return { success: true }
      } catch (error: any) {
        console.error("Error deleting category:", error)
        return { success: false, error: error.message || "An unexpected error occurred" }
      }
    },
    [user, read, write, fetchCategories],
  )

  // Load categories on mount
  useEffect(() => {
    if (user) {
      fetchCategories()
    }
  }, [user, fetchCategories])

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
