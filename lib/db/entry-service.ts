import { getServerDb, handleDbError, logDbOperation, type DbResult, validateInput, measureQueryTime } from "./db-utils"
import { z } from "zod"
import type { Database } from "@/types/supabase"

// Type for entry
export type Entry = Database["public"]["Tables"]["entries"]["Row"]

// Schema for entry creation
const entrySchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  duration: z.number().int().positive("Duration must be a positive number"),
  notes: z.string().optional(),
  value: z.number().optional(),
})

export type EntryCreate = z.infer<typeof entrySchema>
export type EntryUpdate = Partial<EntryCreate>

// Schema for entry filters
const entryFilterSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
})

export type EntryFilter = z.infer<typeof entryFilterSchema>

/**
 * Get entries for a user with optional filtering
 */
export async function getUserEntries(userId: string, filter?: EntryFilter): Promise<DbResult<Entry[]>> {
  try {
    logDbOperation("getUserEntries", { userId, filter })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "getUserEntries" },
      }
    }

    // Validate filter if provided
    if (filter) {
      const validation = validateInput(filter, entryFilterSchema)
      if (validation.error) {
        return {
          data: null,
          error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "getUserEntries" },
        }
      }
    }

    const supabase = getServerDb()

    // Start building the query
    let query = supabase.from("entries").select("*").eq("user_id", userId).order("date", { ascending: false })

    // Apply filters if provided
    if (filter) {
      if (filter.startDate) {
        query = query.gte("date", filter.startDate)
      }

      if (filter.endDate) {
        query = query.lte("date", filter.endDate)
      }

      if (filter.categoryId) {
        query = query.eq("category_id", filter.categoryId)
      }

      if (filter.limit) {
        query = query.limit(filter.limit)
      }

      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1)
      }
    }

    // Measure query performance
    const { result, executionTime } = await measureQueryTime("getUserEntries", async () => {
      return await query
    })

    const { data, error } = result

    if (error) {
      return { data: null, error: handleDbError(error, "getUserEntries") }
    }

    logDbOperation("getUserEntries completed", { count: data.length, executionTime })
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getUserEntries") }
  }
}

/**
 * Get an entry by ID
 */
export async function getEntryById(entryId: string, userId: string): Promise<DbResult<Entry>> {
  try {
    logDbOperation("getEntryById", { entryId, userId })

    // Input validation
    if (!entryId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Entry ID and User ID are required",
          details: null,
          operation: "getEntryById",
        },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase.from("entries").select("*").eq("id", entryId).eq("user_id", userId).single()

    if (error) {
      return { data: null, error: handleDbError(error, "getEntryById") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getEntryById") }
  }
}

/**
 * Create a new entry
 */
export async function createEntry(entry: EntryCreate, userId: string): Promise<DbResult<Entry>> {
  try {
    logDbOperation("createEntry", { entry, userId })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "createEntry" },
      }
    }

    const validation = validateInput(entry, entrySchema)
    if (validation.error) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "createEntry" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("entries")
      .insert({
        ...validation.data,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "createEntry") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "createEntry") }
  }
}

/**
 * Update an entry
 */
export async function updateEntry(entryId: string, entry: EntryUpdate, userId: string): Promise<DbResult<Entry>> {
  try {
    logDbOperation("updateEntry", { entryId, entry, userId })

    // Input validation
    if (!entryId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Entry ID and User ID are required",
          details: null,
          operation: "updateEntry",
        },
      }
    }

    // Partial validation for update
    const partialSchema = entrySchema.partial()
    const validation = validateInput(entry, partialSchema)
    if (validation.error) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "updateEntry" },
      }
    }

    const supabase = getServerDb()
    const { data, error } = await supabase
      .from("entries")
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      return { data: null, error: handleDbError(error, "updateEntry") }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "updateEntry") }
  }
}

/**
 * Delete an entry
 */
export async function deleteEntry(entryId: string, userId: string): Promise<DbResult<null>> {
  try {
    logDbOperation("deleteEntry", { entryId, userId })

    // Input validation
    if (!entryId || !userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "Entry ID and User ID are required",
          details: null,
          operation: "deleteEntry",
        },
      }
    }

    const supabase = getServerDb()
    const { error } = await supabase.from("entries").delete().eq("id", entryId).eq("user_id", userId)

    if (error) {
      return { data: null, error: handleDbError(error, "deleteEntry") }
    }

    return { data: null, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "deleteEntry") }
  }
}

/**
 * Get entry statistics for a user
 */
export async function getEntryStats(userId: string, filter?: EntryFilter): Promise<DbResult<any>> {
  try {
    logDbOperation("getEntryStats", { userId, filter })

    // Input validation
    if (!userId) {
      return {
        data: null,
        error: { code: "INVALID_INPUT", message: "User ID is required", details: null, operation: "getEntryStats" },
      }
    }

    // Validate filter if provided
    if (filter) {
      const validation = validateInput(filter, entryFilterSchema)
      if (validation.error) {
        return {
          data: null,
          error: { code: "VALIDATION_ERROR", message: validation.error, details: null, operation: "getEntryStats" },
        }
      }
    }

    const supabase = getServerDb()

    // Build the query for total duration by category
    const query = supabase.rpc("get_entry_stats_by_category", {
      user_id_param: userId,
      start_date_param: filter?.startDate || null,
      end_date_param: filter?.endDate || null,
      category_id_param: filter?.categoryId || null,
    })

    // Measure query performance
    const { result, executionTime } = await measureQueryTime("getEntryStats", async () => {
      return await query
    })

    const { data, error } = result

    if (error) {
      return { data: null, error: handleDbError(error, "getEntryStats") }
    }

    logDbOperation("getEntryStats completed", { executionTime })
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleDbError(error, "getEntryStats") }
  }
}
