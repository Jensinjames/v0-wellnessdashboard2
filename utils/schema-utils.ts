import { createServerSupabaseClient } from "@/lib/supabase-server"

/**
 * Gets the column names for a specific table
 * @param tableName The name of the table to inspect
 * @returns An array of column names
 */
export async function getTableColumns(tableName: string): Promise<string[]> {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch a single row to get column names
    const { data, error } = await supabase.from(tableName).select("*").limit(1)

    if (error) {
      console.error(`Error fetching columns for table ${tableName}:`, error)
      return []
    }

    // Extract column names from the first row
    return data && data.length > 0 ? Object.keys(data[0]) : []
  } catch (error) {
    console.error(`Unexpected error inspecting table ${tableName}:`, error)
    return []
  }
}

/**
 * Checks if a column exists in a table
 * @param tableName The name of the table to check
 * @param columnName The name of the column to check for
 * @returns True if the column exists, false otherwise
 */
export async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const columns = await getTableColumns(tableName)
  return columns.includes(columnName)
}

/**
 * Gets the actual database schema for debugging purposes
 * @returns An object mapping table names to arrays of column names
 */
export async function getDatabaseSchema(): Promise<Record<string, string[]>> {
  try {
    const supabase = createServerSupabaseClient()
    const schema: Record<string, string[]> = {}

    // List of tables to inspect
    const tables = ["profiles", "users", "wellness_entries", "categories", "goals"]

    for (const table of tables) {
      schema[table] = await getTableColumns(table)
    }

    return schema
  } catch (error) {
    console.error("Error fetching database schema:", error)
    return {}
  }
}
