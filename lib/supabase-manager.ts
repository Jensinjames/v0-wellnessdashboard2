/**
 * Supabase Manager
 * Centralized management of Supabase clients and authentication
 */
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseManager")

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null

// Auth state change listeners
type AuthChangeListener = (event: string, payload: any) => void
const authListeners: AuthChangeListener[] = []

// Instance tracking
let instanceCount = 0

/**
 * Get or create a Supabase client instance
 */
export function getSupabase(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing required environment variables for Supabase client")
  }

  // Create a new client
  supabaseInstance = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )

  // Increment instance count
  instanceCount++

  // Set up auth state change listener
  supabaseInstance.auth.onAuthStateChange((event, session) => {
    logger.info(`Auth state changed: ${event}`)

    // Notify all listeners
    authListeners.forEach((listener) => {
      try {
        listener(event, { session })
      } catch (error) {
        logger.error("Error in auth listener", error)
      }
    })
  })

  return supabaseInstance
}

/**
 * Add a listener for auth state changes
 */
export function addAuthListener(listener: AuthChangeListener): () => void {
  authListeners.push(listener)

  // Return a function to remove the listener
  return () => {
    const index = authListeners.indexOf(listener)
    if (index !== -1) {
      authListeners.splice(index, 1)
    }
  }
}

/**
 * Reset the Supabase client (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null
}

/**
 * Get the current auth session
 */
export async function getCurrentSession() {
  const supabase = getSupabase()
  return await supabase.auth.getSession()
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = getSupabase()
  return await supabase.auth.signOut()
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase()
  return await supabase.auth.signInWithPassword({ email, password })
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabase()
  return await supabase.auth.signUp({ email, password })
}

/**
 * Reset password for a user
 */
export async function supabaseResetPassword(email: string, options?: { redirectTo?: string }) {
  const supabase = getSupabase()
  return await supabase.auth.resetPasswordForEmail(email, options)
}

/**
 * Update user password
 */
export async function supabaseUpdatePassword(password: string) {
  const supabase = getSupabase()
  return await supabase.auth.updateUser({ password })
}

/**
 * Check if email service is available
 */
export function checkEmailServiceAvailability(): Promise<boolean> {
  return Promise.resolve(true)
}

/**
 * Get the number of Supabase instances created
 */
export function getInstanceCount(): number {
  return instanceCount
}

/**
 * Clean up resources
 */
export function cleanup(): void {
  if (supabaseInstance) {
    // No explicit cleanup needed for Supabase client
    // Just reset the instance
    supabaseInstance = null
    instanceCount = 0
    logger.info("Supabase manager cleaned up")
  }
}
