"use client"

import { useCallback } from "react"
import { useSupabaseSubscription } from "./use-supabase-subscription"
import { useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from "./use-supabase-query"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/types/database"

type Category = Database["public"]["Tables"]["wellness_categories"]["Row"]
type CategoryInsert = Database["public"]["Tables"]["wellness_categories"]["Insert"]
type CategoryUpdate = Database["public"]["Tables"]["wellness_categories"]["Update"]

/**
 * Hook for managing wellness categories with real-time updates
 */
export function useWellnessCategories(userId: string | null) {
  const {
    data: categories,
    isLoading,
    error,
  } = useSupabaseSubscription(
    "wellness_categories",
    (query) => query.eq("user_id", userId).order("order_index", { ascending: true }),
    { enabled: !!userId },
  )

  const { insert, isLoading: isInserting } = useSupabaseInsert("wellness_categories")
  const { update, isLoading: isUpdating } = useSupabaseUpdate("wellness_categories")
  const { remove, isLoading: isDeleting } = useSupabaseDelete("wellness_categories")

  const addCategory = useCallback(
    async (category: Omit<CategoryInsert, "user_id" | "created_at" | "updated_at">) => {
      if (!userId) {
        toast({
          title: "Error",
          description: "You must be logged in to add categories",
          variant: "destructive",
        })
        return { success: false }
      }

      const result = await insert({
        ...category,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to add category",
          variant: "destructive",
        })
        return { success: false }
      }

      toast({
        title: "Success",
        description: "Category added successfully",
      })
      return { success: true, data: result.data }
    },
    [userId, insert],
  )

  const updateCategory = useCallback(
    async (id: string, updates: Partial<CategoryUpdate>) => {
      const result = await update(id, {
        ...updates,
        updated_at: new Date().toISOString(),
      })

      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to update category",
          variant: "destructive",
        })
        return { success: false }
      }

      toast({
        title: "Success",
        description: "Category updated successfully",
      })
      return { success: true, data: result.data }
    },
    [update],
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      const result = await remove(id)

      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to delete category",
          variant: "destructive",
        })
        return { success: false }
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
      return { success: true }
    },
    [remove],
  )

  const reorderCategories = useCallback(
    async (orderedIds: string[]) => {
      try {
        // Update each category with its new order index
        const updatePromises = orderedIds.map((id, index) =>
          update(id, { order_index: index, updated_at: new Date().toISOString() }),
        )

        await Promise.all(updatePromises)

        toast({
          title: "Success",
          description: "Categories reordered successfully",
        })
        return { success: true }
      } catch (error) {
        console.error("Error reordering categories:", error)
        toast({
          title: "Error",
          description: "Failed to reorder categories",
          variant: "destructive",
        })
        return { success: false }
      }
    },
    [update],
  )

  return {
    categories,
    isLoading: isLoading || isInserting || isUpdating || isDeleting,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  }
}
