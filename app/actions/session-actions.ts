"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

/**
 * Revokes all sessions for the current user
 * This will sign out the user from all devices
 */
export async function revokeAllSessions() {
  const supabase = createServerClient()

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Revoke all refresh tokens for the user
    // Note: This is a Supabase admin function and requires service role key
    // For security, we're using a server action
    const { error } = await supabase.auth.admin.signOut(user.id, true)

    if (error) {
      return { success: false, error: error.message }
    }

    // Clear cookies
    cookies().delete("supabase-auth-token")

    return { success: true }
  } catch (error) {
    console.error("Error revoking sessions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Extends the current session
 * This can be used to keep a user logged in longer
 */
export async function extendSession(durationInDays = 7) {
  const supabase = createServerClient()

  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "No active session" }
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, session: data.session }
  } catch (error) {
    console.error("Error extending session:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Signs out the current user and redirects to the login page
 */
export async function signOutAndRedirect(redirectTo = "/auth/login") {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect(redirectTo)
}
