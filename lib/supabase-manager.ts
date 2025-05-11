/**
 * Supabase Manager
 * Manages Supabase client instances and provides utility functions
 */
import { getSupabaseClient, resetSupabaseClient } from "@/lib/supabase-client"
import type { Session } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseManager")

// Type for auth state change handler
type AuthStateChangeHandler = (event: string, session: Session | null) => void

/**
 * Get a Supabase client instance
 */
export function getSupabase() {
  return getSupabaseClient()
}

/**
 * Add an auth state change listener
 */
export function addAuthListener(callback: AuthStateChangeHandler) {
  const supabase = getSupabaseClient()
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return {
    removeListener: () => {
      data.subscription.unsubscribe()
    },
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    // Reset client before sign-in to ensure clean state
    resetSupabaseClient()

    const supabase = getSupabaseClient()
    return await supabase.auth.signInWithPassword({ email, password })
  } catch (error) {
    logger.error("Sign in error:", error)
    return { data: null, error }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const supabase = getSupabaseClient()
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  } catch (error) {
    logger.error("Sign up error:", error)
    return { data: null, error }
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const supabase = getSupabaseClient()
    const result = await supabase.auth.signOut()

    // Reset client after sign-out
    resetSupabaseClient()

    return result
  } catch (error) {
    logger.error("Sign out error:", error)

    // Reset client even if there's an error
    resetSupabaseClient()

    return { error }
  }
}

/**
 * Reset password for email
 */
export async function supabaseResetPassword(email: string, options?: { redirectTo?: string }) {
  try {
    const supabase = getSupabaseClient()
    return await supabase.auth.resetPasswordForEmail(email, options)
  } catch (error) {
    logger.error("Reset password error:", error)
    return { error }
  }
}

/**
 * Update user password
 */
export async function supabaseUpdatePassword(password: string) {
  try {
    const supabase = getSupabaseClient()
    return await supabase.auth.updateUser({ password })
  } catch (error) {
    logger.error("Update password error:", error)
    return { error }
  }
}

/**
 * Check if email service is available
 */
export async function checkEmailServiceAvailability(): Promise<boolean> {
  // Simple check - in a real app, you might want to ping your email service
  return true
}

/**
 * Get instance count (for backward compatibility)
 */
export function getInstanceCount(): number {
  return 1
}

/**
 * Cleanup (for backward compatibility)
 */
export function cleanup(): void {
  resetSupabaseClient()
}
