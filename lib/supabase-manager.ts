/**
 * Supabase Manager
 * Centralized management of Supabase clients and authentication
 */
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { isDebugMode } from "@/utils/environment"
import { monitorGoTrueClientInstances } from "./supabase-client"
import { isEmailServiceLikelyAvailable } from "./edge-function-config"

// Singleton instance for the client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null
let authListeners: Array<(event: string, payload: any) => void> = []

// Create and return a Supabase client
export function getSupabase(): ReturnType<typeof createBrowserClient<Database>> {
  if (!supabaseClient) {
    try {
      // Check if required environment variables are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("Missing Supabase environment variables")
        throw new Error("Supabase configuration is missing. Please check your environment variables.")
      }

      // Create a new client if one doesn't exist
      supabaseClient = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce",
          },
          global: {
            headers: {
              "x-application-name": "wellness-dashboard-manager",
            },
          },
        },
      )

      // Set up auth state change listener
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (isDebugMode()) {
          console.log(`Auth state changed: ${event}`, { session: session?.user?.email || "No user" })
        }

        // Notify all listeners
        authListeners.forEach((listener) => {
          try {
            listener(event, { session })
          } catch (error) {
            console.error("Error in auth listener:", error)
          }
        })
      })

      if (isDebugMode()) {
        console.log("Supabase manager client created successfully")

        // Start monitoring GoTrue instances in debug mode
        const monitor = monitorGoTrueClientInstances()
        monitor.start()
      }
    } catch (error) {
      console.error("Error initializing Supabase manager:", error)
      throw error
    }
  }

  return supabaseClient
}

// Reset the client (useful for testing or when auth state changes)
export function resetSupabase() {
  supabaseClient = null
  authListeners = []
}

// Add an auth state change listener
export function addAuthListener(listener: (event: string, payload: any) => void) {
  authListeners.push(listener)

  // Return a function to remove the listener
  return () => {
    authListeners = authListeners.filter((l) => l !== listener)
  }
}

// Check if email service is available
export async function checkEmailServiceAvailability(): Promise<boolean> {
  try {
    return await isEmailServiceLikelyAvailable()
  } catch (error) {
    console.error("Error checking email service availability:", error)
    return false
  }
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
 * Sign out the current user
 */
export async function signOut() {
  const supabase = getSupabase()
  return await supabase.auth.signOut()
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
