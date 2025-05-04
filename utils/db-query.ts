import { getSupabaseClient } from "@/lib/supabase"
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js"
import type { Database } from "@/types/database"

type Table = keyof Database["public"]["Tables"]
type Row<T extends Table> = Database["public"]["Tables"][T]["Row"]
type InsertRow<T extends Table> = Database["public"]["Tables"][T]["Insert"]
type UpdateRow<T extends Table> = Database["public"]["Tables"][T]["Update"]

/**
 * Safely execute a Supabase query with error handling
 * @param queryFn - Function that returns a Supabase query
 * @returns Result of the query with error handling
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await queryFn()

    if (error) {
      console.error("Database query error:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err: any) {
    console.error("Exception in database query:", err)
    return { data: null, error: err.message || "An unexpected error occurred" }
  }
}

/**
 * Get a single row by ID
 * @param table - Table name
 * @param id - Row ID
 * @returns The row or null if not found
 */
export async function getById<T extends Table>(
  table: T,
  id: string,
): Promise<{ data: Row<T> | null; error: string | null }> {
  const supabase = getSupabaseClient()

  return safeQuery<Row<T>>(() => supabase.from(table).select("*").eq("id", id).single())
}

/**
 * Get multiple rows with optional filters
 * @param table - Table name
 * @param filter - Optional filter function
 * @returns Array of rows
 */
export async function getMany<T extends Table>(
  table: T,
  filter?: (query: PostgrestFilterBuilder<any, any, any>) => PostgrestFilterBuilder<any, any, any>,
): Promise<{ data: Row<T>[] | null; error: string | null }> {
  const supabase = getSupabaseClient()

  let query = supabase.from(table).select("*")

  if (filter) {
    query = filter(query)
  }

  return safeQuery<Row<T>[]>(() => query)
}

/**
 * Insert a new row
 * @param table - Table name
 * @param data - Data to insert
 * @returns The inserted row
 */
export async function insertRow<T extends Table>(
  table: T,
  data: InsertRow<T>,
): Promise<{ data: Row<T> | null; error: string | null }> {
  const supabase = getSupabaseClient()

  return safeQuery<Row<T>>(() => supabase.from(table).insert(data).select().single())
}

/**
 * Update a row by ID
 * @param table - Table name
 * @param id - Row ID
 * @param data - Data to update
 * @returns The updated row
 */
export async function updateRow<T extends Table>(
  table: T,
  id: string,
  data: UpdateRow<T>,
): Promise<{ data: Row<T> | null; error: string | null }> {
  const supabase = getSupabaseClient()

  return safeQuery<Row<T>>(() => supabase.from(table).update(data).eq("id", id).select().single())
}

/**
 * Delete a row by ID
 * @param table - Table name
 * @param id - Row ID
 * @returns Success status
 */
export async function deleteRow<T extends Table>(
  table: T,
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.error("Error deleting row:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    console.error("Exception in deleteRow:", err)
    return { success: false, error: err.message || "An unexpected error occurred" }
  }
}
