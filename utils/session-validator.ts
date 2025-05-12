import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

export type SessionValidationResult = {
  valid: boolean
  error: AuthError | null
}

/**
 * Validates the current authentication session
 * @returns Promise with validation result
 */
export async function validateAuthSession(): Promise<SessionValidationResult> {
  try {
    const supabase = createClient()

    // Check if we have an active session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      return {
        valid: false,
        error:
          sessionError ||
          ({
            message: "No active session found. Your session may have expired.",
            name: "SessionError",
            status: 401,
          } as AuthError),
      }
    }

    return { valid: true, error: null }
  } catch (err) {
    console.error("Session validation error:", err)
    return {
      valid: false,
      error: {
        message: "Failed to validate session",
        name: "ValidationError",
        status: 500,
      } as AuthError,
    }
  }
}

/**
 * Checks if the current session is valid for password reset
 * @returns Promise with validation result
 */
export async function validatePasswordResetSession(): Promise<SessionValidationResult> {
  try {
    const supabase = createClient()

    // Check if we have an active session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      return {
        valid: false,
        error:
          sessionError ||
          ({
            message: "Your password reset link is invalid or has expired. Please request a new password reset.",
            name: "PasswordResetError",
            status: 401,
          } as AuthError),
      }
    }

    return { valid: true, error: null }
  } catch (err) {
    console.error("Password reset session validation error:", err)
    return {
      valid: false,
      error: {
        message: "Failed to validate password reset session",
        name: "ValidationError",
        status: 500,
      } as AuthError,
    }
  }
}
