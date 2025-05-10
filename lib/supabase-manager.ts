/**
 * Supabase Manager
 *
 * This module provides utilities for creating and managing Supabase clients
 */
"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for Supabase operations
const supabaseLogger = createLogger("Supabase")

// Global singleton instance
let supabaseClient: SupabaseClient<Database> | null = null

// Track instance count to prevent duplicates
let instanceCount = 0

/**
 * Initialize Supabase client
 */
export function initializeSupabase(): void {
  if (!supabaseClient) {
    try {
      // Explicitly use environment variables to ensure they're properly loaded
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are not properly configured")
      }

      supabaseClient = createClientComponentClient<Database>({
        supabaseUrl,
        supabaseKey,
        options: {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        },
      })

      instanceCount++
      supabaseLogger.info("Supabase client initialized successfully")
    } catch (error) {
      supabaseLogger.error("Failed to initialize Supabase client with explicit config:", error)

      // Fallback to default initialization if explicit config fails
      try {
        supabaseClient = createClientComponentClient<Database>()
        instanceCount++
        supabaseLogger.info("Supabase client initialized with default config")
      } catch (fallbackError) {
        supabaseLogger.error("Failed to initialize Supabase client with default config:", fallbackError)
        throw fallbackError // Re-throw to make the error visible
      }
    }
  }
}

/**
 * Get the Supabase client
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    initializeSupabase()
  }
  return supabaseClient as SupabaseClient<Database>
}

/**
 * Add a listener for authentication state changes
 */
export function addAuthListener(callback: (event: string, session: Session | null) => void): () => void {
  const supabase = getSupabase()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Safely execute a database ping to warm up connections
 */
async function safeDatabasePing(): Promise<void> {
  try {
    const supabase = getSupabase()
    // Use a simple query instead of RPC to warm up the connection
    await supabase.from("profiles").select("count").limit(1)
    supabaseLogger.info("Database ping successful")
  } catch (error) {
    supabaseLogger.info("Database ping failed, but continuing with operation")
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<{ data: any; error: any }> {
  const supabase = getSupabase()

  try {
    // Warm up the connection before the actual auth request
    await safeDatabasePing()

    return await supabase.auth.signInWithPassword({ email, password })
  } catch (error) {
    supabaseLogger.error("Error in signInWithEmail:", error)
    return { data: null, error }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<{ data: any; error: any }> {
  const supabase = getSupabase()

  try {
    // Warm up the connection before the actual auth request
    await safeDatabasePing()

    return await supabase.auth.signUp({
      email,
      password,
    })
  } catch (error) {
    supabaseLogger.error("Error in signUpWithEmail:", error)
    return { data: null, error }
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: any }> {
  const supabase = getSupabase()
  return await supabase.auth.signOut()
}

/**
 * Reset password
 *
 * @param email The email address to send the password reset link to
 * @param options Optional configuration for the password reset
 * @returns An object containing any error that occurred
 */
export async function resetPassword(email: string, options?: { redirectTo?: string }): Promise<{ error: any }> {
  const supabase = getSupabase()

  try {
    // Warm up the connection before the actual auth request
    await safeDatabasePing()

    // Default redirectTo if not provided
    const redirectOptions = options || {}
    if (!redirectOptions.redirectTo && typeof window !== "undefined") {
      redirectOptions.redirectTo = `${window.location.origin}/auth/reset-password`
    }

    supabaseLogger.info(
      `Sending password reset to ${email} with redirectTo: ${redirectOptions.redirectTo || "default"}`,
    )

    // Attempt to send the password reset email
    const result = await supabase.auth.resetPasswordForEmail(email, redirectOptions)

    // Check for specific error messages related to email sending
    if (result.error) {
      if (result.error.message?.includes("sending")) {
        supabaseLogger.error("Email sending error:", result.error)
        return {
          error: {
            message: "Error sending recovery email",
            originalError: result.error,
          },
        }
      }
    }

    return result
  } catch (error: any) {
    supabaseLogger.error("Error in resetPassword:", error)

    // Check if the error is related to email sending
    if (
      error.message?.includes("sending") ||
      (error.error && typeof error.error === "object" && error.error.message?.includes("sending"))
    ) {
      return {
        error: {
          message: "Error sending recovery email",
          originalError: error,
        },
      }
    }

    return { error }
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string): Promise<{ error: any }> {
  const supabase = getSupabase()
  return await supabase.auth.updateUser({ password })
}

/**
 * Get the number of GoTrueClient instances
 */
export function getInstanceCount(): number {
  return instanceCount
}

/**
 * Cleanup function
 */
export function cleanup(): void {
  // No-op for now
}
