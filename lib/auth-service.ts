/**
 * Authentication Service
 * Provides a centralized service for all authentication operations
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for auth operations
const authLogger = createLogger("AuthService")

// Authentication service class
export class AuthService {
  private static instance: AuthService
  private supabase = createClientComponentClient()

  // Singleton pattern to ensure we only have one instance
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
  ): Promise<{
    user: User | null
    session: Session | null
    error: AuthError | Error | null
    emailVerificationSent: boolean
  }> {
    try {
      authLogger.info("Attempting sign up", { email })

      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        authLogger.error("Sign up error:", { error, email })
        return {
          user: null,
          session: null,
          error,
          emailVerificationSent: false,
        }
      }

      // Check if email verification was sent
      const emailVerificationSent = !data.session

      authLogger.info("Sign up successful", {
        userId: data.user?.id,
        emailVerificationSent,
      })

      return {
        user: data.user,
        session: data.session,
        error: null,
        emailVerificationSent,
      }
    } catch (error: any) {
      authLogger.error("Unexpected sign up error:", error)
      return {
        user: null,
        session: null,
        error,
        emailVerificationSent: false,
      }
    }
  }

  /**
   * Sign in with email and password with retry mechanism
   */
  async signIn(
    email: string,
    password: string,
  ): Promise<{
    user: User | null
    session: Session | null
    error: AuthError | Error | null
    retried?: boolean
  }> {
    return this.signInWithRetry(email, password, 0)
  }

  /**
   * Internal method for sign in with retry logic
   */
  private async signInWithRetry(
    email: string,
    password: string,
    retryCount: number,
    maxRetries = 3,
  ): Promise<{
    user: User | null
    session: Session | null
    error: AuthError | Error | null
    retried?: boolean
  }> {
    try {
      if (retryCount > 0) {
        authLogger.info(`Retrying sign in (attempt ${retryCount} of ${maxRetries})`, { email })
      } else {
        authLogger.info("Attempting sign in", { email })
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      // If successful or it's not a 500 unexpected_failure, return the result
      if (!error || !(error?.__isAuthError && error?.status === 500 && error?.code === "unexpected_failure")) {
        if (error) {
          authLogger.error("Sign in error:", { error, email })
        } else {
          authLogger.info("Sign in successful", { userId: data.user?.id })
        }

        return {
          user: data?.user || null,
          session: data?.session || null,
          error,
          retried: retryCount > 0,
        }
      }

      // If we've reached max retries, return the error
      if (retryCount >= maxRetries) {
        authLogger.error(`Sign in failed after ${maxRetries} retries`, { error, email })
        return {
          user: null,
          session: null,
          error,
          retried: true,
        }
      }

      // Calculate backoff delay with jitter (100ms, 200ms, 400ms base times with jitter)
      const delay = Math.floor(2 ** retryCount * 100 * (0.75 + Math.random() * 0.5))

      authLogger.info(`Auth service returned 500 error. Retrying in ${delay}ms...`, { email })

      // Wait for the backoff period
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Retry with incremented retry counter
      return this.signInWithRetry(email, password, retryCount + 1, maxRetries)
    } catch (error: any) {
      authLogger.error("Unexpected sign in error:", error)
      return {
        user: null,
        session: null,
        error,
        retried: retryCount > 0,
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | Error | null }> {
    try {
      authLogger.info("Attempting sign out")

      const { error } = await this.supabase.auth.signOut()

      if (error) {
        authLogger.error("Sign out error:", error)
        return { error }
      }

      authLogger.info("Sign out successful")
      return { error: null }
    } catch (error: any) {
      authLogger.error("Unexpected sign out error:", error)
      return { error }
    }
  }

  /**
   * Request password reset for an email
   */
  async resetPassword(email: string): Promise<{
    error: AuthError | Error | null
  }> {
    try {
      authLogger.info("Requesting password reset", { email })

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        authLogger.error("Password reset request error:", { error, email })
        return { error }
      }

      authLogger.info("Password reset email sent", { email })
      return { error: null }
    } catch (error: any) {
      authLogger.error("Unexpected password reset error:", error)
      return { error }
    }
  }

  /**
   * Update user's password
   */
  async updatePassword(password: string): Promise<{
    error: AuthError | Error | null
  }> {
    try {
      authLogger.info("Updating password")

      const { error } = await this.supabase.auth.updateUser({
        password,
      })

      if (error) {
        authLogger.error("Password update error:", error)
        return { error }
      }

      authLogger.info("Password updated successfully")
      return { error: null }
    } catch (error: any) {
      authLogger.error("Unexpected password update error:", error)
      return { error }
    }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<{
    session: Session | null
    error: AuthError | Error | null
  }> {
    try {
      const { data, error } = await this.supabase.auth.getSession()

      if (error) {
        authLogger.error("Error getting session:", error)
        return { session: null, error }
      }

      return { session: data.session, error: null }
    } catch (error: any) {
      authLogger.error("Unexpected error getting session:", error)
      return { session: null, error }
    }
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<{
    user: User | null
    error: AuthError | Error | null
  }> {
    try {
      const { data, error } = await this.supabase.auth.getUser()

      if (error) {
        authLogger.error("Error getting user:", error)
        return { user: null, error }
      }

      return { user: data.user, error: null }
    } catch (error: any) {
      authLogger.error("Unexpected error getting user:", error)
      return { user: null, error }
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{
    error: AuthError | Error | null
  }> {
    try {
      authLogger.info("Resending verification email", { email })

      const { error } = await this.supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        authLogger.error("Error resending verification email:", { error, email })
        return { error }
      }

      authLogger.info("Verification email resent", { email })
      return { error: null }
    } catch (error: any) {
      authLogger.error("Unexpected error resending verification email:", error)
      return { error }
    }
  }

  /**
   * Check if email is verified
   */
  async isEmailVerified(email: string): Promise<{
    verified: boolean
    error: AuthError | Error | null
  }> {
    try {
      // This is a workaround since Supabase doesn't provide a direct way to check
      // We'll try to sign in with a dummy password and check the error
      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password: "dummy_password_for_verification_check",
      })

      if (error) {
        // If the error is about email not confirmed, then it's not verified
        if (error.message.includes("Email not confirmed")) {
          return { verified: false, error: null }
        }

        // If it's an invalid login credentials error, the email is verified
        // (because the error is about the password, not about verification)
        if (error.message.includes("Invalid login credentials")) {
          return { verified: true, error: null }
        }

        // For other errors, return the error
        return { verified: false, error }
      }

      // If no error, the email is verified (but this shouldn't happen with a dummy password)
      return { verified: true, error: null }
    } catch (error: any) {
      authLogger.error("Unexpected error checking email verification:", error)
      return { verified: false, error }
    }
  }

  /**
   * Set up auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      authLogger.info("Auth state changed", { event })
      callback(event, session)
    })
  }
}

// Export a singleton instance
export const authService = AuthService.getInstance()
