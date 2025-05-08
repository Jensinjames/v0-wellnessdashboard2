"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

const authLogger = createLogger("AuthMonitor")

// Track the current user session
let currentSession: Session | null = null

// Track the monitoring status
let isMonitoring = false

// Function to start monitoring
export function startAuthMonitoring(): () => void {
  if (typeof window === "undefined") return () => {}

  if (isMonitoring) {
    console.warn("Auth monitoring already started")
    return () => {}
  }

  isMonitoring = true
  authLogger.info("Starting auth monitoring")

  const supabase = createClientComponentClient()

  // Get initial session
  supabase.auth.getSession().then(({ data }) => {
    currentSession = data.session
  })

  // Set up auth state change listener
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      authLogger.info(`Auth state change: ${event}`)

      // Skip if no user involved
      if (!session?.user && !currentSession?.user) {
        return
      }

      // Determine user ID
      const userId = session?.user?.id || currentSession?.user?.id

      if (!userId) {
        return
      }

      // Map events to actions
      const actionMap: Record<AuthChangeEvent, string> = {
        SIGNED_IN: "login",
        SIGNED_OUT: "logout",
        USER_UPDATED: "user_updated",
        USER_DELETED: "user_deleted",
        PASSWORD_RECOVERY: "password_reset_requested",
        TOKEN_REFRESHED: "token_refreshed",
        MFA_CHALLENGE_VERIFIED: "mfa_challenge_verified",
        PASSWORD_RESET: "password_reset",
      }

      const action = actionMap[event] || `auth_${event.toLowerCase()}`

      // Prepare old and new values
      const oldValues = currentSession
        ? {
            email: currentSession.user?.email,
            last_sign_in_at: currentSession.user?.last_sign_in_at,
          }
        : null

      const newValues = session
        ? {
            email: session.user?.email,
            last_sign_in_at: session.user?.last_sign_in_at,
          }
        : null

      // Log the event to the server
      await fetch("/api/auth/log-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action,
          oldValues,
          newValues,
        }),
      })

      // Update current session
      currentSession = session
    } catch (error) {
      authLogger.error("Error handling auth state change:", error)
    }
  })

  // Return cleanup function
  return () => {
    isMonitoring = false
    authLogger.info("Stopping auth monitoring")
    subscription.unsubscribe()
  }
}

// Function to stop monitoring
export function stopAuthMonitoring() {
  isMonitoring = false
  authLogger.info("Auth monitoring stopped")
}

// Function to get monitoring data
export function getMonitoringData() {
  return {
    instanceCount: 1, // Placeholder - replace with actual instance count if needed
    lastChecked: Date.now(), // Placeholder - replace with actual last checked time
  }
}

// Function to check if monitoring is active
export function isMonitoringActive() {
  return isMonitoring
}
