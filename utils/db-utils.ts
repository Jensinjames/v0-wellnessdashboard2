import { getSupabaseClient } from "@/lib/supabase"

export async function ensureProfilesTable() {
  const supabase = getSupabaseClient()

  try {
    // Check if the profiles table exists by attempting to query it
    const { error } = await supabase.from("profiles").select("id").limit(1)

    if (error && error.code === "42P01") {
      // PostgreSQL error code for undefined_table
      console.log("Profiles table does not exist. Creating...")

      // Create the profiles table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      const { error: createError } = await supabase.rpc("exec_sql", { sql: createTableQuery })

      if (createError) {
        console.error("Error creating profiles table:", createError)
        return false
      }

      console.log("Profiles table created successfully")
      return true
    }

    return true
  } catch (error) {
    console.error("Error checking/creating profiles table:", error)
    return false
  }
}
