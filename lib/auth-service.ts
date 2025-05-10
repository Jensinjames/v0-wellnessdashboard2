import type { User, Session, AuthError } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/utils/supabase-client"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("AuthService")

// Define retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelay: 500, // ms
  maxDelay: 3000, // ms
}

// Define auth service interface
interface AuthService {
  getSession: () => Promise<{ session: Session | null; error: AuthError | null }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    user: User | null
    session: Session | null
    error: AuthError | null
    retried?: boolean
  }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    user: User | null
    error: AuthError | null
    emailVerificationSent?: boolean
  }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null; retried?: boolean }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error: string | null }>
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    data: { subscription: { unsubscribe: () => void } }
  }
}

// Implement auth service
class SupabaseAuthService implements AuthService {
  async getSession() {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.getSession()
      return { session: data.session, error }
    } catch (error) {
      logger.error("Unexpected error in getSession:", error)
      return { session: null, error: error as AuthError }
    }
  }

  async signIn(email: string, password: string) {
    let retried = false
    let attempt = 0

    while (attempt <= RETRY_CONFIG.maxRetries) {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        // If successful or not a 500 error, return immediately
        if (!error || (error && error.status !== 500)) {
          return { user: data.user, session: data.session, error, retried }
        }

        // If we get here, it's a 500 error and we should retry
        if (attempt < RETRY_CONFIG.maxRetries) {
          retried = true
          attempt++

          // Calculate exponential backoff delay
          const delay = Math.min(RETRY_CONFIG.initialDelay * Math.pow(2, attempt - 1), RETRY_CONFIG.maxDelay)

          logger.warn(`Auth service error (500), retrying in ${delay}ms (attempt ${attempt})`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          // Max retries reached
          return { user: null, session: null, error, retried }
        }
      } catch (error) {
        logger.error("Unexpected error in signIn:", error)
        return { user: null, session: null, error: error as AuthError, retried }
      }
    }

    // This should never be reached due to the return in the loop
    return { user: null, session: null, error: null, retried }
  }

  async signUp(email: string, password: string) {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      // Check if email verification was sent
      const emailVerificationSent = !error && data?.user?.identities?.length === 0

      return {
        user: data.user,
        error,
        emailVerificationSent,
      }
    } catch (error) {
      logger.error("Unexpected error in signUp:", error)
      return { user: null, error: error as AuthError }
    }
  }

  async signOut() {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      logger.error("Unexpected error in signOut:", error)
      return { error: error as AuthError }
    }
  }

  async resetPassword(email: string) {
    let retried = false
    let attempt = 0

    while (attempt <= RETRY_CONFIG.maxRetries) {
      try {
        const supabase = getSupabaseClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        // If successful or not a 500 error, return immediately
        if (!error || (error && error.status !== 500)) {
          return { error, retried }
        }

        // If we get here, it's a 500 error and we should retry
        if (attempt < RETRY_CONFIG.maxRetries) {
          retried = true
          attempt++

          // Calculate exponential backoff delay
          const delay = Math.min(RETRY_CONFIG.initialDelay * Math.pow(2, attempt - 1), RETRY_CONFIG.maxDelay)

          logger.warn(`Auth service error (500), retrying in ${delay}ms (attempt ${attempt})`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          // Max retries reached
          return { error, retried }
        }
      } catch (error) {
        logger.error("Unexpected error in resetPassword:", error)
        return { error: error as AuthError, retried }
      }
    }

    // This should never be reached due to the return in the loop
    return { error: null, retried }
  }

  async updatePassword(password: string) {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.updateUser({
        password,
      })
      return { error }
    } catch (error) {
      logger.error("Unexpected error in updatePassword:", error)
      return { error: error as AuthError }
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        logger.error("Error resending verification email:", error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      logger.error("Unexpected error in resendVerificationEmail:", error)
      return { success: false, error: error.message || "Failed to resend verification email" }
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const supabase = getSupabaseClient()
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Create and export a singleton instance
export const authService = new SupabaseAuthService()

// Debug mode control function
export function setAuthServiceDebugMode(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_service_debug", enabled ? "true" : "false")
    console.log(`Auth service debug mode ${enabled ? "enabled" : "disabled"}`)
  }
}
