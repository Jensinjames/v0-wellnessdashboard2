import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Authentication features may not work properly.")
}

// Create the Supabase client with auto refresh
export const supabase = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
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

// Helper function to handle Supabase errors consistently
export function handleSupabaseError(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as { message: string }).message
  }

  if (typeof error === "string") {
    return error
  }

  return "An unknown error occurred"
}
