/**
 * Supabase Manager
 * Provides a simplified interface for Supabase operations
 */
import { getClient } from "@/lib/supabase"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"
import { isEmailServiceLikelyAvailable } from "@/lib/edge-function-config"

const logger = createLogger("SupabaseManager")

/**
 * Get the Supabase client
 */
export function getSupabase() {
  return getClient()
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = getSupabase()
    return await supabase.auth.signInWithPassword({ email, password })
  } catch (error) {
    logger.error("Sign in error:", error)
    return { data: null, error: error as AuthError }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const supabase = getSupabase()
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  } catch (error) {
    logger.error("Sign up error:", error)
    return { data: null, error: error as AuthError }
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const supabase = getSupabase()
    return await supabase.auth.signOut()
  } catch (error) {
    logger.error("Sign out error:", error)
    return { error: error as AuthError }
  }
}

/**
 * Reset password for email
 */
export async function supabaseResetPassword(email: string, options?: { redirectTo?: string }) {
  try {
    const supabase = getSupabase()
    return await supabase.auth.resetPasswordForEmail(email, options)
  } catch (error) {
    logger.error("Reset password error:", error)
    return { error: error as AuthError }
  }
}

/**
 * Update user password
 */
export async function supabaseUpdatePassword(password: string) {
  try {
    const supabase = getSupabase()
    return await supabase.auth.updateUser({ password })
  } catch (error) {
    logger.error("Update password error:", error)
    return { error: error as AuthError }
  }
}

/**
 * Add an auth state change listener
 */
export function addAuthListener(
  callback: (
    event: "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED" | "PASSWORD_RECOVERY" | "TOKEN_REFRESHED",
    session: {
      session: Session | null
      user: User | null
    },
  ) => void,
) {
  const supabase = getSupabase()
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event as any, { session, user: session?.user || null })
  })

  return () => {
    data.subscription.unsubscribe()
  }
}

/**
 * Check if email service is available
 */
export async function checkEmailServiceAvailability(): Promise<boolean> {
  return isEmailServiceLikelyAvailable()
}
