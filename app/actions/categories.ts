"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

export interface WellnessCategory {
  id: string
  name: string
  color: string
  icon?: string | null
  user_id?: string
  created_at?: string
  updated_at?: string
}

export async function getCategories(userId: string): Promise<WellnessCategory[]> {
  try {
    const supabase = createServerSupabaseClient()

    // Get system categories (no user_id) and user's custom categories
    const { data, error } = await supabase
      .from("wellness_categories")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      throw new Error(error.message)
    }

    return data || []
  } catch (error: any) {
    console.error("Unexpected error fetching categories:", error)
    return []
  }
}

export async function createCategory(
  userId: string,
  category: Omit<WellnessCategory, "id" | "created_at" | "updated_at">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // Check if a category with this name already exists for this user
    const { data: existingCategory, error: checkError } = await supabase
      .from("wellness_categories")
      .select("id")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq("name", category.name)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking for existing category:", checkError)
      return { success: false, error: checkError.message }
    }

    if (existingCategory) {
      return {
        success: false,
        error: `A category named "${category.name}" already exists`,
      }
    }

    // Create new category
    const newCategory = {
      id: uuidv4(),
      name: category.name,
      color: category.color,
      icon: category.icon || null,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("wellness_categories").insert(newCategory)

    if (error) {
      console.error("Error creating category:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return { success: true, id: newCategory.id }
  } catch (error: any) {
    console.error("Unexpected error creating category:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  updates: Partial<WellnessCategory>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // First check if this is a system category (no user_id)
    const { data: category, error: fetchError } = await supabase
      .from("wellness_categories")
      .select("user_id")
      .eq("id", categoryId)
      .single()

    if (fetchError) {
      console.error("Error fetching category:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // If it's a system category, don't allow updates
    if (!category.user_id) {
      return {
        success: false,
        error: "System categories cannot be modified",
      }
    }

    // If it's not the user's category, don't allow updates
    if (category.user_id !== userId) {
      return {
        success: false,
        error: "You can only modify your own categories",
      }
    }

    // Check if name is being updated and if it would conflict
    if (updates.name) {
      const { data: existingCategory, error: checkError } = await supabase
        .from("wellness_categories")
        .select("id")
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .eq("name", updates.name)
        .neq("id", categoryId)
        .maybeSingle()

      if (checkError) {
        console.error("Error checking for existing category:", checkError)
        return { success: false, error: checkError.message }
      }

      if (existingCategory) {
        return {
          success: false,
          error: `A category named "${updates.name}" already exists`,
        }
      }
    }

    // Update the category
    const { error } = await supabase
      .from("wellness_categories")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", categoryId)

    if (error) {
      console.error("Error updating category:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error updating category:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function deleteCategory(
  userId: string,
  categoryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // First check if this is a system category (no user_id)
    const { data: category, error: fetchError } = await supabase
      .from("wellness_categories")
      .select("user_id")
      .eq("id", categoryId)
      .single()

    if (fetchError) {
      console.error("Error fetching category:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // If it's a system category, don't allow deletion
    if (!category.user_id) {
      return {
        success: false,
        error: "System categories cannot be deleted",
      }
    }

    // If it's not the user's category, don't allow deletion
    if (category.user_id !== userId) {
      return {
        success: false,
        error: "You can only delete your own categories",
      }
    }

    // Check if there are any goals or entries using this category
    const { count: goalCount, error: goalError } = await supabase
      .from("wellness_goals")
      .select("id", { count: "exact", head: true })
      .eq("category", categoryId)

    if (goalError) {
      console.error("Error checking goals:", goalError)
      return { success: false, error: goalError.message }
    }

    if (goalCount && goalCount > 0) {
      return {
        success: false,
        error: "This category is being used in goals and cannot be deleted",
      }
    }

    // Delete the category
    const { error } = await supabase.from("wellness_categories").delete().eq("id", categoryId)

    if (error) {
      console.error("Error deleting category:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting category:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}
