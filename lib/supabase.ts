import { createClient } from "@supabase/supabase-js"

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Authentication features may not work properly.")
}

// Create the Supabase client with auto refresh
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Helper function to check if session exists
export async function checkSession() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error checking session:", error)
      return {
        valid: false,
        session: null,
        error,
      }
    }

    return {
      valid: !!data.session,
      session: data.session,
    }
  } catch (error) {
    console.error("Error checking session:", error)
    return {
      valid: false,
      session: null,
      error,
    }
  }
}

// Helper function to refresh session
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Error refreshing session:", error)
      return {
        success: false,
        error,
      }
    }

    return {
      success: true,
      session: data.session,
    }
  } catch (error) {
    console.error("Error refreshing session:", error)
    return {
      success: false,
      error,
    }
  }
}
