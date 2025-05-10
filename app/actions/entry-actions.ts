"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { z } from "zod"
import type { WellnessEntry } from "@/types/wellness"

// Schema for entry validation
const entrySchema = z.object({
  category: z.string().min(1, "Category is required"),
  activity: z.string().min(1, "Activity is required").max(100, "Activity name is too long"),
  duration: z.number().min(0.1, "Duration must be at least 0.1 hours").max(24, "Duration cannot exceed 24 hours"),
  notes: z.string().max(500, "Notes are too long").optional(),
  timestamp: z.string().optional(),
})

// Type for the return value of our actions
type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

/**
 * Add a wellness entry
 */
export async function addEntry(formData: FormData | Record<string, any>): Promise<ActionResult<WellnessEntry>> {
  try {
    // Get data from FormData or direct object
    const rawData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData

    // Convert duration to number
    if (typeof rawData.duration === "string") {
      rawData.duration = Number.parseFloat(rawData.duration)
    }

    // Set timestamp if not provided
    if (!rawData.timestamp) {
      rawData.timestamp = new Date().toISOString()
    }

    // Validate the data
    const validationResult = entrySchema.safeParse(rawData)

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
        error: "Invalid entry data",
        fieldErrors,
      }
    }

    const { category, activity, duration, notes, timestamp } = validationResult.data

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

    // Create the entry
    const newEntry = {
      user_id: user.id,
      category,
      activity,
      duration,
      notes: notes || null,
      timestamp: timestamp || new Date().toISOString(),
    }

    const { data, error } = await supabase.from("wellness_entries").insert(newEntry).select().single()

    if (error) {
      console.error("Error adding entry:", error)
      return {
        success: false,
        error: "Failed to add entry",
      }
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard")

    return {
      success: true,
      data: data as WellnessEntry,
      message: "Entry added successfully",
    }
  } catch (error) {
    console.error("Unexpected error adding entry:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}

/**
 * Delete a wellness entry
 */
export async function deleteEntry(entryId: string): Promise<ActionResult> {
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

    // Check if this is the user's entry
    const { data: entry, error: fetchError } = await supabase
      .from("wellness_entries")
      .select("user_id")
      .eq("id", entryId)
      .single()

    if (fetchError) {
      console.error("Error fetching entry:", fetchError)
      return {
        success: false,
        error: "Failed to fetch entry",
      }
    }

    // If it's not the user's entry, don't allow deletion
    if (entry.user_id !== user.id) {
      return {
        success: false,
        error: "You can only delete your own entries",
      }
    }

    // Delete the entry
    const { error } = await supabase.from("wellness_entries").delete().eq("id", entryId)

    if (error) {
      console.error("Error deleting entry:", error)
      return {
        success: false,
        error: "Failed to delete entry",
      }
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Entry deleted successfully",
    }
  } catch (error) {
    console.error("Unexpected error deleting entry:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}
