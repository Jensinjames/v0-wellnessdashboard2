/**
 * Supabase Auth Provider
 * Implements the AuthProvider interface using Supabase
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient, User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import {
  type AuthProvider,
  type AuthUser,
  type AuthSession,
  type AuthCredentials,
  type AuthResult,
  type PasswordResetResult,
  type PasswordUpdateResult,
  type AuthError,
  AuthErrorCode,
  type AuthEvent,
} from "./types"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseAuth")

/**
 * Maps Supabase errors to our standardized auth error codes
 */
function mapSupabaseError(error: any): AuthError {
  if (!error) {
    return {
      code: AuthErrorCode.UNKNOWN_ERROR,
      message: "An unknown error occurred",
    }
  }

  const errorMessage = error.message || error.error_description || error.error || String(error)

  // Network errors
  if (errorMessage.includes("fetch") || errorMessage.includes("network") || error instanceof TypeError) {
    return {
      code: AuthErrorCode.NETWORK_ERROR,
      message: "Network error. Please check your connection and try again.",
      originalError: error,
    }
  }

  // Timeout errors
  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return {
      code: AuthErrorCode.TIMEOUT,
      message: "The request timed out. Please try again.",
      originalError: error,
    }
  }

  // Invalid credentials
  if (errorMessage.includes("Invalid login") || errorMessage.includes("Invalid credentials")) {
    return {
      code: AuthErrorCode.WRONG_PASSWORD,
      message: "Invalid email or password. Please try again.",
      originalError: error,
    }
  }

  // User not found
  if (errorMessage.includes("user not found") || errorMessage.includes("User not found")) {
    return {
      code: AuthErrorCode.USER_NOT_FOUND,
      message: "No account found with this email address.",
      originalError: error,
    }
  }

  // Email in use
  if (errorMessage.includes("already exists") || errorMessage.includes("already in use")) {
    return {
      code: AuthErrorCode.EMAIL_IN_USE,
      message: "This email is already registered. Please sign in or use a different email.",
      originalError: error,
    }
  }

  // Email sending errors
  if (errorMessage.includes("sending email") || errorMessage.includes("recovery email")) {
    return {
      code: AuthErrorCode.EMAIL_SEND_FAILED,
      message: "Failed to send email. Please try again later.",
      originalError: error,
    }
  }

  // OTP expired
  if (errorMessage.includes("access_denied") && errorMessage.includes("otp_expired")) {
    return {
      code: AuthErrorCode.OTP_EXPIRED,
      message: "The password reset link has expired. Please request a new one.",
      originalError: error,
    }
  }

  // Server errors
  if (error.status >= 500 || errorMessage.includes("server error")) {
    return {
      code: AuthErrorCode.SERVER_ERROR,
      message: "A server error occurred. Please try again later.",
      originalError: error,
    }
  }

  // Default to unknown error
  return {
    code: AuthErrorCode.UNKNOWN_ERROR,
    message: errorMessage || "An unknown error occurred",
    originalError: error,
  }
}

/**
 * Maps a Supabase User to our AuthUser interface
 */
function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_confirmed_at ? true : false,
    metadata: {
      ...user.user_metadata,
      ...user.app_metadata,
    },
    createdAt: user.created_at,
  }
}

/**
 * Maps a Supabase Session to our AuthSession interface
 */
function mapSupabaseSession(session: Session | null): AuthSession | null {
  if (!session) return null

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    user: mapSupabaseUser(session.user)!,
  }
}

/**
 * Supabase implementation of the AuthProvider interface
 */
export class SupabaseAuthProvider implements AuthProvider {
  private client: SupabaseClient<Database>
  private listeners: Array<(event: AuthEvent, session: AuthSession | null) => void> = []

  constructor() {
    this.client = createClientComponentClient<Database>()

    // Set up auth state change listener
    this.client.auth.onAuthStateChange((event, session) => {
      logger.debug("Auth state change:", event)

      // Map Supabase event to our event type
      let mappedEvent: AuthEvent = "SIGNED_OUT"

      switch (event) {
        case "SIGNED_IN":
          mappedEvent = "SIGNED_IN"
          break
        case "SIGNED_OUT":
          mappedEvent = "SIGNED_OUT"
          break
        case "USER_UPDATED":
          mappedEvent = "USER_UPDATED"
          break
        case "PASSWORD_RECOVERY":
          mappedEvent = "PASSWORD_RECOVERY"
          break
        case "TOKEN_REFRESHED":
          mappedEvent = "TOKEN_REFRESHED"
          break
      }

      // Notify all listeners
      const mappedSession = mapSupabaseSession(session)
      this.listeners.forEach((listener) => listener(mappedEvent, mappedSession))
    })
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const { data, error } = await this.client.auth.getSession()

      if (error) {
        logger.error("Error getting session:", error)
        return null
      }

      return mapSupabaseSession(data.session)
    } catch (error) {
      logger.error("Unexpected error getting session:", error)
      return null
    }
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await this.client.auth.getUser()

      if (error) {
        logger.error("Error getting user:", error)
        return null
      }

      return mapSupabaseUser(data.user)
    } catch (error) {
      logger.error("Unexpected error getting user:", error)
      return null
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        logger.error("Sign in error:", error)
        return {
          success: false,
          error: mapSupabaseError(error),
        }
      }

      return {
        success: true,
        user: mapSupabaseUser(data.user),
        session: mapSupabaseSession(data.session),
      }
    } catch (error) {
      logger.error("Unexpected sign in error:", error)
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        logger.error("Sign up error:", error)
        return {
          success: false,
          error: mapSupabaseError(error),
        }
      }

      return {
        success: true,
        user: mapSupabaseUser(data.user),
        session: mapSupabaseSession(data.session),
      }
    } catch (error) {
      logger.error("Unexpected sign up error:", error)
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await this.client.auth.signOut()
    } catch (error) {
      logger.error("Sign out error:", error)
    }
  }

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<PasswordResetResult> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        logger.error("Reset password error:", error)
        return {
          success: false,
          error: mapSupabaseError(error),
        }
      }

      return { success: true }
    } catch (error) {
      logger.error("Unexpected reset password error:", error)
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }
  }

  /**
   * Update the user's password
   */
  async updatePassword(password: string): Promise<PasswordUpdateResult> {
    try {
      const { error } = await this.client.auth.updateUser({ password })

      if (error) {
        logger.error("Update password error:", error)
        return {
          success: false,
          error: mapSupabaseError(error),
        }
      }

      return { success: true }
    } catch (error) {
      logger.error("Unexpected update password error:", error)
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }
  }

  /**
   * Verify a one-time password (OTP)
   */
  async verifyOtp(otp: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.verifyOtp({ token_hash: otp, type: "recovery" })

      if (error) {
        logger.error("Verify OTP error:", error)
        return {
          success: false,
          error: mapSupabaseError(error),
        }
      }

      return {
        success: true,
        user: mapSupabaseUser(data.user),
        session: mapSupabaseSession(data.session),
      }
    } catch (error) {
      logger.error("Unexpected verify OTP error:", error)
      return {
        success: false,
        error: mapSupabaseError(error),
      }
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<AuthSession | null> {
    try {
      const { data, error } = await this.client.auth.refreshSession()

      if (error) {
        logger.error("Refresh session error:", error)
        return null
      }

      return mapSupabaseSession(data.session)
    } catch (error) {
      logger.error("Unexpected refresh session error:", error)
      return null
    }
  }

  /**
   * Register a callback for auth state changes
   */
  onAuthStateChange(callback: (event: AuthEvent, session: AuthSession | null) => void): () => void {
    this.listeners.push(callback)

    // Return a function to remove the listener
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }
}

// Create a singleton instance
let authProviderInstance: SupabaseAuthProvider | null = null

/**
 * Get the Supabase auth provider instance
 */
export function getSupabaseAuthProvider(): SupabaseAuthProvider {
  if (!authProviderInstance) {
    authProviderInstance = new SupabaseAuthProvider()
  }

  return authProviderInstance
}
