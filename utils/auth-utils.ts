import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
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
 * Refresh a session if needed
 */
export async function refreshSessionIfNeeded(session: Session | null): Promise<Session | null> {
  if (!session || !shouldRefreshSession(session)) {
    return session
  }

  try {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Error refreshing session:", error)
      return session
    }

    return data.session
  } catch (error) {
    console.error("Unexpected error refreshing session:", error)
    return session
  }
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): string | null {
  if (!session?.user) return null

  // Check for role in user metadata
  if (session.user.user_metadata?.role) {
    return session.user.user_metadata.role
  }

  // Default role
  return "user"
}

/**
 * Check if user has required role
 */
export function hasRole(session: Session | null, requiredRole: string): boolean {
  const userRole = getUserRole(session)
  if (!userRole) return false

  // Simple role check - can be expanded for more complex role hierarchies
  if (requiredRole === "admin") {
    return userRole === "admin"
  }

  if (requiredRole === "editor") {
    return userRole === "admin" || userRole === "editor"
  }

  // Default user role - everyone has this
  return true
}
