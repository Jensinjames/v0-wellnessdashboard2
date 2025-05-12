"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase-server"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getUserCategories,
  getCategoryById,
  type CategoryCreate,
  type CategoryUpdate,
} from "@/lib/db"

/**
 * Get all categories for the authenticated user
 */
export async function getCategories() {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get categories using the database service
    const { data, error } = await getUserCategories(user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get categories error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get a category by ID
 */
export async function getCategory(categoryId: string) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get category using the database service
    const { data, error } = await getCategoryById(categoryId, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get category error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Create a new category for the authenticated user
 */
export async function createCategoryAction(formData: FormData) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Extract category data from form
    const name = formData.get("name") as string
    const color = formData.get("color") as string
    const icon = formData.get("icon") as string
    const description = formData.get("description") as string

    // Create category using the database service
    const categoryData: CategoryCreate = {
      name,
      color,
      icon,
      description,
    }

    const { data, error } = await createCategory(categoryData, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error) {
    console.error("Create category error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Update a category for the authenticated user
 */
export async function updateCategoryAction(categoryId: string, formData: FormData) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Extract category data from form
    const name = formData.get("name") as string
    const color = formData.get("color") as string
    const icon = formData.get("icon") as string
    const description = formData.get("description") as string

    // Update category using the database service
    const categoryData: CategoryUpdate = {
      name,
      color,
      icon,
      description,
    }

    const { data, error } = await updateCategory(categoryId, categoryData, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/categories")
    revalidatePath("/dashboard")
    revalidatePath(`/categories/${categoryId}`)

    return { success: true, data }
  } catch (error) {
    console.error("Update category error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Delete a category for the authenticated user
 */
export async function deleteCategoryAction(categoryId: string) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Delete category using the database service
    const { error } = await deleteCategory(categoryId, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/categories")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Delete category error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
