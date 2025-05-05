"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { wellnessEntryFormSchema } from "@/schemas/wellness-entry-schemas"
import { validateWithSchema, handleValidationError } from "@/utils/server-validation"
import { generateId } from "@/utils/id-generator"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Server action to create a new wellness entry
 */
export async function createWellnessEntry(formData: FormData) {
  // Convert FormData to object
  const rawData = Object.fromEntries(formData.entries())

  // Parse metrics array from JSON string if needed
  if (typeof rawData.metrics === "string") {
    try {
      rawData.metrics = JSON.parse(rawData.metrics as string)
    } catch (e) {
      return {
        error: "Invalid metrics data",
        fieldErrors: { metrics: ["Invalid metrics format"] },
        code: "VALIDATION_ERROR",
      }
    }
  }

  // Validate with Zod schema
  const validationResult = await validateWithSchema(wellnessEntryFormSchema, rawData, {
    logErrors: true,
    source: "createWellnessEntry",
  })

  // Handle validation errors
  if (validationResult.status === "error") {
    return handleValidationError(validationResult)
  }

  // Validated data
  const data = validationResult.data

  try {
    // Add ID if not present
    const entryData = {
      ...data,
      id: data.id || generateId(),
      created_at: new Date().toISOString(),
    }

    // Insert into database
    const { error } = await supabase.from("wellness_entries").insert(entryData)

    if (error) throw error

    // Revalidate the dashboard page
    revalidatePath("/")

    return { success: true, data: entryData }
  } catch (error) {
    console.error("Error creating wellness entry:", error)
    return {
      error: "Failed to create wellness entry",
      code: "DATABASE_ERROR",
    }
  }
}

/**
 * Server action to update an existing wellness entry
 */
export async function updateWellnessEntry(id: string, formData: FormData) {
  // Convert FormData to object
  const rawData = Object.fromEntries(formData.entries())

  // Parse metrics array from JSON string if needed
  if (typeof rawData.metrics === "string") {
    try {
      rawData.metrics = JSON.parse(rawData.metrics as string)
    } catch (e) {
      return {
        error: "Invalid metrics data",
        fieldErrors: { metrics: ["Invalid metrics format"] },
        code: "VALIDATION_ERROR",
      }
    }
  }

  // Validate with Zod schema
  const validationResult = await validateWithSchema(
    wellnessEntryFormSchema,
    { ...rawData, id },
    {
      logErrors: true,
      source: "updateWellnessEntry",
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
    const { error } = await supabase.from("wellness_entries").update(data).eq("id", id)

    if (error) throw error

    // Revalidate the dashboard page
    revalidatePath("/")

    return { success: true, data }
  } catch (error) {
    console.error("Error updating wellness entry:", error)
    return {
      error: "Failed to update wellness entry",
      code: "DATABASE_ERROR",
    }
  }
}

/**
 * Server action to delete a wellness entry
 */
export async function deleteWellnessEntry(id: string) {
  try {
    // Delete from database
    const { error } = await supabase.from("wellness_entries").delete().eq("id", id)

    if (error) throw error

    // Revalidate the dashboard page
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting wellness entry:", error)
    return {
      error: "Failed to delete wellness entry",
      code: "DATABASE_ERROR",
    }
  }
}
