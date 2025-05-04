import { createClient } from "@supabase/supabase-js"
import { logDatabaseError } from "@/utils/db-error-handler"

/**
 * Initialize the database with required tables and functions
 * This should be called during app initialization
 */
export async function initializeDatabase() {
  console.log("Initializing database...")

  try {
    // Create a Supabase client with admin privileges
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Check if profiles table exists
    const { error: checkError } = await supabaseAdmin.from("profiles").select("id").limit(1)

    // If table exists, we're good
    if (!checkError) {
      console.log("Database already initialized")
      return { success: true, message: "Database already initialized" }
    }

    // If error is not about missing table, report it
    if (!checkError.message.includes('relation "profiles" does not exist')) {
      logDatabaseError(checkError, "checking database initialization")
      return {
        success: false,
        message: `Error checking database: ${checkError.message}`,
      }
    }

    console.log("Creating database schema...")

    // Create profiles table
    const { error: createError } = await supabaseAdmin.rpc("create_profiles_table")

    if (createError) {
      logDatabaseError(createError, "initializing database")
      return {
        success: false,
        message: `Error initializing database: ${createError.message}`,
      }
    }

    console.log("Database initialized successfully")
    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    logDatabaseError(error, "initializing database")
    return {
      success: false,
      message: `Unexpected error initializing database: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
