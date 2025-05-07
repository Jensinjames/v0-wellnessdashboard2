import { createClient } from "@supabase/supabase-js"
import type { Session, User } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Create a Supabase client for use in the Pages Router
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)

/**
 * Gets the current session from the client
 * Use this in Pages components to get the session
 */
export async function getClientSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return data.session
  } catch (error) {
    console.error("Unexpected error in getClientSession:", error)
    return null
  }
}

/**
 * Gets the current user from the client
 * Use this in Pages components to get the user
 */
export async function getClientUser(): Promise<User | null> {
  try {
    const session = await getClientSession()
    return session?.user ?? null
  } catch (error) {
    console.error("Unexpected error in getClientUser:", error)
    return null
  }
}

/**
 * Checks if the user is authenticated on the client
 * Returns a boolean indicating authentication status
 */
export async function isClientAuthenticated(): Promise<boolean> {
  try {
    const session = await getClientSession()
    return !!session
  } catch (error) {
    console.error("Unexpected error in isClientAuthenticated:", error)
    return false
  }
}

/**
 * Export the supabase client for direct use
 */
export { supabase }
