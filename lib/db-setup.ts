import { createClient } from "@/lib/supabase-server"
import { logDatabaseError } from "@/utils/db-error-handler"

/**
 * Ensure the database schema is properly set up
 */
export async function ensureDatabaseSchema(): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  try {
    // Check if profiles table exists
    const { error: checkError } = await supabase.from("profiles").select("id").limit(1)

    // If table exists, we're good
    if (!checkError) {
      console.log("Profiles table exists")
      return { success: true, error: null }
    }

    // If error is not about missing table, report it
    if (!checkError.message.includes('relation "profiles" does not exist')) {
      logDatabaseError(checkError, "checking profiles table")
      return { success: false, error: checkError.message }
    }

    // Create profiles table
    console.log("Creating profiles table...")

    // Use RPC to create the table (safer than raw SQL)
    const { error: createError } = await supabase.rpc("create_profiles_table")

    if (createError) {
      logDatabaseError(createError, "creating profiles table")
      return { success: false, error: createError.message }
    }

    console.log("Profiles table created successfully")
    return { success: true, error: null }
  } catch (error) {
    logDatabaseError(error, "ensureDatabaseSchema")
    return {
      success: false,
      error: `Failed to set up database schema: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Initialize the database with required tables and functions
 * This should be called during app initialization
 */
export async function initializeDatabase(): Promise<void> {
  console.log("Initializing database...")

  const { success, error } = await ensureDatabaseSchema()

  if (!success) {
    console.error("Database initialization failed:", error)
    // Don't throw - we want the app to continue even if DB setup fails
    // The app can handle missing tables with proper error handling
  } else {
    console.log("Database initialized successfully")
  }
}
