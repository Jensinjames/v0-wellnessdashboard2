import { cookies } from "next/headers"
import { createServerComponentClient } from "@/lib/supabase-ssr"
import type { Session, User } from "@supabase/supabase-js"

/**
 * Gets the current session from the server
 * Use this in Server Components to get the session
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient(cookieStore)

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return session
  } catch (error) {
    console.error("Unexpected error in getServerSession:", error)
    return null
  }
}

/**
 * Gets the current user from the server
 * Use this in Server Components to get the user
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const session = await getServerSession()
    return session?.user ?? null
  } catch (error) {
    console.error("Unexpected error in getServerUser:", error)
    return null
  }
}

/**
 * Checks if the user is authenticated
 * Returns a boolean indicating authentication status
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getServerSession()
    return !!session
  } catch (error) {
    console.error("Unexpected error in isAuthenticated:", error)
    return false
  }
}
