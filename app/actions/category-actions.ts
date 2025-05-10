"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { z } from "zod"
import type { WellnessCategory } from "@/types/wellness"

// Schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name is too long"),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  icon: z.string().optional().nullable(),
})

// Type for the return value of our actions
type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

/**
 * Create a new wellness category
 */
export async function createCategory(
  formData: FormData | Record<string, any>,
): Promise<ActionResult<WellnessCategory>> {
  try {
    // Get data from FormData or direct object
    const rawData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData

    // Validate the data
    const validationResult = categorySchema.safeParse(rawData)

    if (!validationResult.success) {
      // Return field-specific errors
      const fieldErrors = validationResult.error.errors.reduce(
        (acc, error) => {
          acc[error.path[0]] = error.message
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        success: false,
        error: "Invalid category data",
        fieldErrors,
      }
    }

    const { name, color, icon } = validationResult.data

    // Get the current user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Check if a category with this name already exists
    const { data: existingCategory, error: checkError } = await supabase
      .from("wellness_categories")
      .select("id")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq("name", name)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking for existing category:", checkError)
      return {
        success: false,
        error: "Failed to check for existing category",
      }
    }

    if (existingCategory) {
      return {
        success: false,
        error: `A category named "${name}" already exists`,
        fieldErrors: { name: `A category named "${name}" already exists` },
      }
    }

    // Create the new category
    const newCategory: Omit<WellnessCategory, "id" | "created_at" | "updated_at"> = {
      name,
      color,
      icon: icon || null,
      user_id: user.id,
    }

    const { data, error } = await supabase.from("wellness_categories").insert(newCategory).select().single()

    if (error) {
      console.error("Error creating category:", error)
      return {
        success: false,
        error: "Failed to create category",
      }
    }

    // Revalidate relevant paths
    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: data as WellnessCategory,
      message: "Category created successfully",
    }
  } catch (error) {
    console.error("Unexpected error creating category:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

/**
 * Update an existing wellness category
 */
export async function updateCategory(
  categoryId: string,
  formData: FormData | Record<string, any>,
): Promise<ActionResult<WellnessCategory>> {
  try {
    // Get data from FormData or direct object
    const rawData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData

    // Validate the data
    const validationResult = categorySchema.safeParse(rawData)

    if (!validationResult.success) {
      // Return field-specific errors
      const fieldErrors = validationResult.error.errors.reduce(
        (acc, error) => {
          acc[error.path[0]] = error.message
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        success: false,
        error: "Invalid category data",
        fieldErrors,
      }
    }

    const { name, color, icon } = validationResult.data

    // Get the current user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // First check if this is a system category (no user_id)
    const { data: category, error: fetchError } = await supabase
      .from("wellness_categories")
      .select("user_id")
      .eq("id", categoryId)
      .single()

    if (fetchError) {
      console.error("Error fetching category:", fetchError)
      return {
        success: false,
        error: "Failed to fetch category",
      }
    }

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
    if (name) {
      const { data: existingCategory, error: checkError } = await supabase
        .from("wellness_categories")
        .select("id")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq("name", name)
        .neq("id", categoryId)
        .maybeSingle()

      if (checkError) {
        console.error("Error checking for existing category:", checkError)
        return {
          success: false,
          error: "Failed to check for existing category",
        }
      }

      if (existingCategory) {
        return {
          success: false,
          error: `A category named "${name}" already exists`,
          fieldErrors: { name: `A category named "${name}" already exists` },
        }
      }
    }

    // Update the category
    const updates = {
      name,
      color,
      icon: icon || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("wellness_categories")
      .update(updates)
      .eq("id", categoryId)
      .select()
      .single()

    if (error) {
      console.error("Error updating category:", error)
      return {
        success: false,
        error: "Failed to update category",
      }
    }

    // Revalidate relevant paths
    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: data as WellnessCategory,
      message: "Category updated successfully",
    }
  } catch (error) {
    console.error("Unexpected error updating category:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

/**
 * Delete a wellness category
 */
export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  try {
    // Get the current user
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // First check if this is a system category (no user_id)
    const { data: category, error: fetchError } = await supabase
      .from("wellness_categories")
      .select("user_id")
      .eq("id", categoryId)
      .single()

    if (fetchError) {
      console.error("Error fetching category:", fetchError)
      return {
        success: false,
        error: "Failed to fetch category",
      }
    }

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
    const { count: goalCount, error: goalError } = await supabase
      .from("wellness_goals")
      .select("id", { count: "exact", head: true })
      .eq("category", categoryId)

    if (goalError) {
      console.error("Error checking goals:", goalError)
      return {
        success: false,
        error: "Failed to check for related goals",
      }
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
      return {
        success: false,
        error: "Failed to delete category",
      }
    }

    // Revalidate relevant paths
    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Category deleted successfully",
    }
  } catch (error) {
    console.error("Unexpected error deleting category:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}
