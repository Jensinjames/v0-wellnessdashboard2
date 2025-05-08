/**
 * Supabase Manager
 * A centralized manager for Supabase client instances with proper lifecycle management
 */
"use client"

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient, Session, User } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { clientEnv } from "@/lib/env"

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null
let instanceCount = 0
const listeners: Set<(event: string, payload: any) => void> = new Set()

// Debug mode
const DEBUG = clientEnv.DEBUG_MODE === "true"

// Debug logging
function log(...args: any[]) {
  if (DEBUG) {
    console.log("[SupabaseManager]", ...args)
  }
}

/**
 * Initialize the Supabase client
 * This should be called once at the application startup
 */
export function initializeSupabase(): SupabaseClient<Database> {
  if (supabaseInstance) {
    log("Supabase client already initialized, returning existing instance")
    return supabaseInstance
  }

  log("Initializing Supabase client")

  // Validate environment variables
  if (!clientEnv.SUPABASE_URL || !clientEnv.SUPABASE_ANON_KEY) {
    throw new Error("Missing required Supabase environment variables")
  }

  // Create the client
  const client = createClient<Database>(clientEnv.SUPABASE_URL, clientEnv.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "wellness-dashboard-auth",
      debug: DEBUG,
    },
    global: {
      headers: {
        "x-application-name": "wellness-dashboard",
        "x-client-instance": `instance-${++instanceCount}`,
      },
    },
  })

  // Set up auth state change listener
  client.auth.onAuthStateChange((event, session) => {
    log("Auth state change:", event)
    notifyListeners(event, { session })
  })

  // Store the instance
  supabaseInstance = client

  return client
}

/**
 * Get the Supabase client instance
 * This will initialize the client if it doesn't exist
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    return initializeSupabase()
  }
  return supabaseInstance
}

/**
 * Reset the Supabase client
 * This should be called when signing out
 */
export function resetSupabase(): void {
  log("Resetting Supabase client")

  // Clear the instance
  supabaseInstance = null
}

/**
 * Add a listener for auth events
 */
export function addAuthListener(callback: (event: string, payload: any) => void): () => void {
  listeners.add(callback)

  return () => {
    listeners.delete(callback)
  }
}

/**
 * Notify all listeners of an auth event
 */
function notifyListeners(event: string, payload: any): void {
  listeners.forEach((listener) => {
    try {
      listener(event, payload)
    } catch (error) {
      console.error("Error in auth listener:", error)
    }
  })
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabase()
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession()
  return session?.user || null
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ data: { user: User | null; session: Session | null } | null; error: Error | null }> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ data: { user: User | null; session: Session | null } | null; error: Error | null }> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${clientEnv.SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: new Error(error.message) }
    }

    // Reset the client after sign out
    resetSupabase()

    return { error: null }
  } catch (error: any) {
    return { error }
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${clientEnv.SITE_URL}/auth/reset-password`,
    })

    if (error) {
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    return { error }
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string): Promise<{ error: Error | null }> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    return { error }
  }
}

/**
 * Get instance count for debugging
 */
export function getInstanceCount(): number {
  return instanceCount
}

/**
 * Clean up resources
 * This should be called when the application is shutting down
 */
export function cleanup(): void {
  log("Cleaning up Supabase manager")

  // Clear the instance
  supabaseInstance = null

  // Clear listeners
  listeners.clear()
}
