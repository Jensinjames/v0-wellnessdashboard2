"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient, User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Singleton instance
let supabaseClient: SupabaseClient<Database> | null = null

// Track instance count
let instanceCount = 0

// Type for auth state change listener
type AuthStateChangeCallback = (event: string, session: { session: Session | null; user: User | null }) => void

/**
 * Initialize Supabase client
 */
export function initializeSupabase(): void {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>()
    instanceCount++
  }
}

/**
 * Get the Supabase client instance
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    initializeSupabase()
  }
  return supabaseClient as SupabaseClient<Database>
}

/**
 * Add an auth state change listener
 * @param callback Function to call when auth state changes
 * @returns Function to remove the listener
 */
export function addAuthListener(callback: AuthStateChangeCallback): () => void {
  const supabase = getSupabase()

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, {
      session,
      user: session?.user || null,
    })
  })

  return () => {
    data.subscription.unsubscribe()
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = getSupabase()

    // Validate inputs
    if (!email || !password) {
      return {
        data: null,
        error: new Error("Email and password are required"),
      }
    }

    // Attempt sign in
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Check for successful sign in but missing user data
    if (!result.error && !result.data?.user) {
      console.error("Sign in succeeded but no user data returned")
      return {
        data: null,
        error: new Error("Authentication failed: No user data returned"),
      }
    }

    return result
  } catch (error) {
    console.error("Error in signInWithEmail:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabase()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = getSupabase()
  return supabase.auth.signOut()
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabase = getSupabase()
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
}

/**
 * Update password
 */
export async function updatePassword(password: string) {
  const supabase = getSupabase()
  return supabase.auth.updateUser({ password })
}

/**
 * Get the number of GoTrueClient instances
 */
export function getInstanceCount(): number {
  return instanceCount
}

/**
 * Reset the Supabase client
 * Useful for testing and after sign-out
 */
export function resetSupabaseClient(): void {
  supabaseClient = null
}

/**
 * Cleanup function to reset the Supabase client
 */
export function cleanup(): void {
  supabaseClient = null
  instanceCount = 0
}
