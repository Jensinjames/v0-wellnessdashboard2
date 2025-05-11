import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { User, Session } from "@supabase/supabase-js"

/**
 * Check if a user's email is verified
 */
export function isEmailVerified(user: User | null): boolean {
  return !!user?.email_confirmed_at
}

/**
 * Check if a session is valid and not expired
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false

  // Check if the session has an expiry time
  if (!session.expires_at) return false

  // Convert expires_at to milliseconds (it's in seconds)
  const expiresAt = session.expires_at * 1000

  // Check if the session has expired
  return Date.now() < expiresAt
}

/**
 * Get the remaining time of a session in seconds
 */
export function getSessionRemainingTime(session: Session | null): number {
  if (!session || !session.expires_at) return 0

  const expiresAt = session.expires_at * 1000
  const remainingMs = expiresAt - Date.now()

  return Math.max(0, Math.floor(remainingMs / 1000))
}

/**
 * Check if a session needs to be refreshed soon (within the next 5 minutes)
 */
export function shouldRefreshSession(session: Session | null): boolean {
  const remainingSeconds = getSessionRemainingTime(session)
  // Refresh if less than 5 minutes remaining
  return remainingSeconds < 300
}

/**
 * Get user role from user metadata or roles table
 * This function should be called server-side
 */
export async function getUserRole(userId: string): Promise<string> {
  try {
    // Use server client to get role from database
    const supabase = createServerSupabaseClient()

    // First check the user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single()

    if (roleData?.role) {
      return roleData.role
    }

    // If no role found in table, check user metadata
    const { data, error } = await supabase.auth.getUser()

    if (data?.user?.user_metadata?.role) {
      return data.user.user_metadata.role
    }

    // Default role
    return "user"
  } catch (error) {
    console.error("Error getting user role:", error)
    return "user"
  }
}

/**
 * Check if user has admin role
 * This function should be called server-side
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === "admin"
}

/**
 * Check if user has required role
 * This function should be called server-side
 */
export async function hasRole(userId: string, requiredRole: string): Promise<boolean> {
  const userRole = await getUserRole(userId)

  // Simple role hierarchy
  if (requiredRole === "admin") {
    return userRole === "admin"
  }

  if (requiredRole === "editor") {
    return userRole === "admin" || userRole === "editor"
  }

  // Default user role - everyone has this
  return true
}
