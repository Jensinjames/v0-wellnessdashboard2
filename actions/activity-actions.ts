"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { activityFormSchema } from "@/schemas/activity-form-schemas"
import { validateWithSchema, handleValidationError } from "@/utils/server-validation"
import { generateId } from "@/utils/id-generator"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Server action to create a new activity
 */
export async function createActivity(formData: FormData) {
  // Convert FormData to object
  const rawData = Object.fromEntries(formData.entries())

  // Validate with Zod schema
  const validationResult = await validateWithSchema(activityFormSchema, rawData, {
    logErrors: true,
    source: "createActivity",
  })

  // Handle validation errors
  if (validationResult.status === "error") {
    return handleValidationError(validationResult)
  }

  // Validated data
  const data = validationResult.data

  try {
    // Add ID if not present
    const activityData = {
      ...data,
      id: data.id || generateId(),
      created_at: new Date().toISOString(),
    }

    // Insert into database
    const { error } = await supabase.from("activities").insert(activityData)

    if (error) throw error

    // Revalidate the activities page
    revalidatePath("/activity")

    return { success: true, data: activityData }
  } catch (error) {
    console.error("Error creating activity:", error)
    return {
      error: "Failed to create activity",
      code: "DATABASE_ERROR",
    }
  }
}

/**
 * Server action to update an existing activity
 */
export async function updateActivity(id: string, formData: FormData) {
  // Convert FormData to object
  const rawData = Object.fromEntries(formData.entries())

  // Validate with Zod schema
  const validationResult = await validateWithSchema(
    activityFormSchema,
    { ...rawData, id },
    {
      logErrors: true,
      source: "updateActivity",
    },
  )

  // Handle validation errors
  if (validationResult.status === "error") {
    return handleValidationError(validationResult)
  }

  // Validated data
  const data = validationResult.data

  try {
    // Update in database
    const { error } = await supabase.from("activities").update(data).eq("id", id)

    if (error) throw error

    // Revalidate the activities page
    revalidatePath("/activity")

    return { success: true, data }
  } catch (error) {
    console.error("Error updating activity:", error)
    return {
      error: "Failed to update activity",
      code: "DATABASE_ERROR",
    }
  }
}

/**
 * Server action to delete an activity
 */
export async function deleteActivity(id: string) {
  try {
    // Delete from database
    const { error } = await supabase.from("activities").delete().eq("id", id)

    if (error) throw error

    // Revalidate the activities page
    revalidatePath("/activity")

    return { success: true }
  } catch (error) {
    console.error("Error deleting activity:", error)
    return {
      error: "Failed to delete activity",
      code: "DATABASE_ERROR",
    }
  }
}
