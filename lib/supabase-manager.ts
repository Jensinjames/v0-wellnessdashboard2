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

// Global singleton instance
let supabaseClient: SupabaseClient<Database> | null = null

// Track instance count to prevent duplicates
let instanceCount = 0

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
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<{ data: any; error: any }> {
  const supabase = getSupabase()
  return await supabase.auth.signInWithPassword({ email, password })
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<{ data: any; error: any }> {
  const supabase = getSupabase()
  return await supabase.auth.signUp({
    email,
    password,
  })
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
 */
export async function resetPassword(email: string): Promise<{ error: any }> {
  const supabase = getSupabase()
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  })
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
