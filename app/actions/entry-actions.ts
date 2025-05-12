"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase-server"
import {
  createEntry,
  updateEntry,
  deleteEntry,
  getUserEntries,
  getEntryById,
  getEntryStats,
  type EntryCreate,
  type EntryUpdate,
  type EntryFilter,
} from "@/lib/db"

/**
 * Get entries for the authenticated user
 */
export async function getEntries(filter?: EntryFilter) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get entries using the database service
    const { data, error } = await getUserEntries(user.id, filter)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get entries error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get entry statistics for the authenticated user
 */
export async function getEntryStatistics(filter?: EntryFilter) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get entry statistics using the database service
    const { data, error } = await getEntryStats(user.id, filter)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get entry statistics error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get an entry by ID
 */
export async function getEntry(entryId: string) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get entry using the database service
    const { data, error } = await getEntryById(entryId, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get entry error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Create a new entry for the authenticated user
 */
export async function createEntryAction(formData: FormData) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Extract entry data from form
    const category_id = formData.get("category_id") as string
    const date = formData.get("date") as string
    const duration = Number.parseInt(formData.get("duration") as string, 10)
    const notes = formData.get("notes") as string
    const value = formData.has("value") ? Number.parseFloat(formData.get("value") as string) : undefined

    // Create entry using the database service
    const entryData: EntryCreate = {
      category_id,
      date,
      duration,
      notes,
      value,
    }

    const { data, error } = await createEntry(entryData, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/activity")
    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error) {
    console.error("Create entry error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Update an entry for the authenticated user
 */
export async function updateEntryAction(entryId: string, formData: FormData) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Extract entry data from form
    const category_id = formData.get("category_id") as string
    const date = formData.get("date") as string
    const duration = Number.parseInt(formData.get("duration") as string, 10)
    const notes = formData.get("notes") as string
    const value = formData.has("value") ? Number.parseFloat(formData.get("value") as string) : undefined

    // Update entry using the database service
    const entryData: EntryUpdate = {
      category_id,
      date,
      duration,
      notes,
      value,
    }

    const { data, error } = await updateEntry(entryId, entryData, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/activity")
    revalidatePath("/dashboard")
    revalidatePath(`/activity/${entryId}`)

    return { success: true, data }
  } catch (error) {
    console.error("Update entry error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Delete an entry for the authenticated user
 */
export async function deleteEntryAction(entryId: string) {
  try {
    // Get current user
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Delete entry using the database service
    const { error } = await deleteEntry(entryId, user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath("/activity")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Delete entry error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
