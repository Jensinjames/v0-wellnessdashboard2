import { getServerDb, handleDbError, logDbOperation, type DbResult, validateInput, measureQueryTime } from "./db-utils"
import { z } from "zod"
import type { Database } from "@/types/supabase"

// Type for category
export type Category = Database["public"]["Tables"]["categories"]["Row"]

// Schema for category creation
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  icon: z.string().optional(),
  description: z.string().optional(),
})

export type CategoryCreate = z.infer<typeof categorySchema>
export type CategoryUpdate = Partial<CategoryCreate>

/**
 * Get all categories for a user
 */
export async function getUserCategories(userId: string): Promise<DbResult<Category[]>> {
  try {
    logDbOperation("getUserCategories", { userId })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "getUserCategories" },
      }
    }

    const supabase = getServerDb()

    // Measure query performance
    const { result, executionTime } = await measureQueryTime("getUserCategories", async () => {
      return await supabase.from("categories").select("*").eq("user_id", userId).order("name")
    })

    const { data, error } = result

    if (error) {
      return { data: null, error: handleDbError(error, "getUserCategories") }
    }

    logDbOperation("getUserCategories completed", { count: data.length, executionTime })
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getUserCategories") }
  }
}

/**
 * Get a category by ID
 */
export async function getCategoryById(categoryId: string, userId: string): Promise<DbResult<Category>> {
  try {
    logDbOperation("getCategoryById", { categoryId, userId })

    // Input validation
    if (!categoryId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Category ID and User ID are required",
          details: null,
          operation: "getCategoryById",
        },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "getCategoryById") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getCategoryById") }
  }
}

/**
 * Create a new category
 */
export async function createCategory(category: CategoryCreate, userId: string): Promise<DbResult<Category>> {
  try {
    logDbOperation("createCategory", { category, userId })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "createCategory" },
      }
    }

    const validation = validateInput(category, categorySchema)
    if (validation.error) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "createCategory" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("categories")
      .insert({
        ...validation.data,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "createCategory") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "createCategory") }
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: string,
  category: CategoryUpdate,
  userId: string,
): Promise<DbResult<Category>> {
  try {
    logDbOperation("updateCategory", { categoryId, category, userId })

    // Input validation
    if (!categoryId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Category ID and User ID are required",
          details: null,
          operation: "updateCategory",
        },
      }
    }

    // Partial validation for update
    const partialSchema = categorySchema.partial()
    const validation = validateInput(category, partialSchema)
    if (validation.error) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "updateCategory" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("categories")
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", categoryId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "updateCategory") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "updateCategory") }
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string, userId: string): Promise<DbResult<null>> {
  try {
    logDbOperation("deleteCategory", { categoryId, userId })

    // Input validation
    if (!categoryId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Category ID and User ID are required",
          details: null,
          operation: "deleteCategory",
        },
      }
    }

    const supabase = getServerDb()
    const { error } = await supabase.from("categories").delete().eq("id", categoryId).eq("user_id", userId)

    if (error) {
      return { data: null, error: handleDbError(error, "deleteCategory") }
    }

    return { data: null, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "deleteCategory") }
  }
}
