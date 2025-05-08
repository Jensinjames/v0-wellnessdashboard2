/**
 * Enhanced Supabase Authentication Helper
 * Provides robust authentication utilities with proper error handling
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for auth operations
const authLogger = createLogger("Auth")

// Error mapping for user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  "Email not confirmed": "Please verify your email address before signing in.",
  "Invalid login credentials": "The email or password you entered is incorrect.",
  "Email already registered": "An account with this email already exists.",
  "Password should be at least 6 characters": "Password must be at least 6 characters long.",
  "User not found": "No account found with this email address.",
  'relation "user_changes_log" does not exist': "Authentication system is being updated. Please try again.",
}

/**
 * Get a user-friendly error message
 */
export function getFriendlyErrorMessage(error: AuthError | Error | null): string {
  if (!error) return "An unknown error occurred"

  // Check for known error messages
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (error.message.includes(key)) {
      return message
    }
  }

  // Default error message
  return "Authentication failed. Please try again."
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = createClientComponentClient()

    authLogger.info("Attempting sign in", { email })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      authLogger.error("Sign in error:", { error, email })
      return { data: null, error }
    }

    authLogger.info("Sign in successful", { userId: data.user?.id })
    return { data, error: null }
  } catch (error: any) {
    authLogger.error("Unexpected sign in error:", error)
    return {
      data: null,
      error: new Error(error.message || "Failed to sign in"),
    }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const supabase = createClientComponentClient()

    authLogger.info("Attempting sign up", { email })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      authLogger.error("Sign up error:", { error, email })
      return { data: null, error }
    }

    authLogger.info("Sign up successful", { userId: data.user?.id })
    return { data, error: null }
  } catch (error: any) {
    authLogger.error("Unexpected sign up error:", error)
    return {
      data: null,
      error: new Error(error.message || "Failed to sign up"),
    }
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  try {
    const supabase = createClientComponentClient()

    authLogger.info("Requesting password reset", { email })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      authLogger.error("Password reset request error:", { error, email })
      return { success: false, error }
    }

    authLogger.info("Password reset email sent", { email })
    return { success: true, error: null }
  } catch (error: any) {
    authLogger.error("Unexpected password reset error:", error)
    return {
      success: false,
      error: new Error(error.message || "Failed to send password reset email"),
    }
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string) {
  try {
    const supabase = createClientComponentClient()

    authLogger.info("Updating password")

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      authLogger.error("Password update error:", error)
      return { success: false, error }
    }

    authLogger.info("Password updated successfully")
    return { success: true, error: null }
  } catch (error: any) {
    authLogger.error("Unexpected password update error:", error)
    return {
      success: false,
      error: new Error(error.message || "Failed to update password"),
    }
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    const supabase = createClientComponentClient()

    authLogger.info("Signing out")

    const { error } = await supabase.auth.signOut()

    if (error) {
      authLogger.error("Sign out error:", error)
      return { success: false, error }
    }

    authLogger.info("Sign out successful")
    return { success: true, error: null }
  } catch (error: any) {
    authLogger.error("Unexpected sign out error:", error)
    return {
      success: false,
      error: new Error(error.message || "Failed to sign out"),
    }
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<{ session: Session | null; error: Error | null }> {
  try {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      authLogger.error("Error getting session:", error)
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (error: any) {
    authLogger.error("Unexpected error getting session:", error)
    return {
      session: null,
      error: new Error(error.message || "Failed to get session"),
    }
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
  try {
    const { session, error: sessionError } = await getCurrentSession()

    if (sessionError || !session) {
      return { user: null, error: sessionError }
    }

    return { user: session.user, error: null }
  } catch (error: any) {
    authLogger.error("Unexpected error getting user:", error)
    return {
      user: null,
      error: new Error(error.message || "Failed to get user"),
    }
  }
}

/**
 * Log authentication event to user_changes_log
 * This is a utility function to manually log auth events
 */
export async function logAuthEvent(userId: string, action: string, oldValues?: any, newValues?: any) {
  try {
    const supabase = createClientComponentClient()

    // Get client info
    const clientInfo = typeof window !== "undefined" ? window.navigator.userAgent : "server"

    await supabase.from("user_changes_log").insert({
      user_id: userId,
      action,
      old_values: oldValues || null,
      new_values: newValues || null,
      client_info: clientInfo,
    })

    return { success: true, error: null }
  } catch (error: any) {
    authLogger.error("Error logging auth event:", error)
    return {
      success: false,
      error: new Error(error.message || "Failed to log auth event"),
    }
  }
}
