import { getSupabaseClient } from "@/utils/supabase-client"
import { createLogger } from "@/utils/logger"
import { isDebugMode } from "@/lib/env-utils"

// Create a dedicated logger
const logger = createLogger("TokenManager")

// Define custom events for token management
export const TOKEN_EVENTS = {
  REFRESH_SUCCESS: "auth:token:refresh:success",
  REFRESH_FAILURE: "auth:token:refresh:failure",
  SESSION_EXPIRED: "auth:session:expired",
}

// Initialize token refresh monitoring
export function initTokenRefreshMonitoring() {
  if (typeof window === "undefined") return () => {}

  // Set up the auth state change listener
  const setupTokenListener = async () => {
    try {
      const supabase = getSupabaseClient()

      // Listen for auth state changes
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (isDebugMode()) {
          logger.debug(`Auth state changed: ${event}`, { sessionExists: !!session })
        }

        if (event === "TOKEN_REFRESHED" && session) {
          // Dispatch a custom event for token refresh success
          window.dispatchEvent(new CustomEvent(TOKEN_EVENTS.REFRESH_SUCCESS))
        } else if (event === "SIGNED_OUT") {
          // Dispatch a custom event for session expiration
          window.dispatchEvent(new CustomEvent(TOKEN_EVENTS.SESSION_EXPIRED))
        }
      })

      return () => {
        data.subscription.unsubscribe()
      }
    } catch (error) {
      logger.error("Error setting up token listener:", error)
      return () => {}
    }
  }

  // Start monitoring
  const unsubscribePromise = setupTokenListener()

  // Return cleanup function
  return () => {
    unsubscribePromise.then((unsubscribe) => {
      if (unsubscribe) unsubscribe()
    })
  }
}

// Manually refresh the token
export async function refreshToken() {
  if (typeof window === "undefined") return { success: false, error: "Cannot refresh token on server" }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      logger.error("Error refreshing token:", error)

      // Dispatch a custom event for token refresh failure
      window.dispatchEvent(
        new CustomEvent(TOKEN_EVENTS.REFRESH_FAILURE, {
          detail: { error },
        }),
      )

      return { success: false, error: error.message }
    }

    if (!data.session) {
      logger.warn("No session returned from token refresh")

      // Dispatch a custom event for session expiration
      window.dispatchEvent(new CustomEvent(TOKEN_EVENTS.SESSION_EXPIRED))

      return { success: false, error: "No session returned" }
    }

    // Dispatch a custom event for token refresh success
    window.dispatchEvent(new CustomEvent(TOKEN_EVENTS.REFRESH_SUCCESS))

    return { success: true, error: null }
  } catch (error: any) {
    logger.error("Unexpected error refreshing token:", error)

    // Dispatch a custom event for token refresh failure
    window.dispatchEvent(
      new CustomEvent(TOKEN_EVENTS.REFRESH_FAILURE, {
        detail: { error },
      }),
    )

    return { success: false, error: error.message || "Failed to refresh token" }
  }
}

// Check if the session is valid
export async function isSessionValid() {
  if (typeof window === "undefined") return false

  try {
    const supabase = getSupabaseClient()
    const { data } = await supabase.auth.getSession()
    return !!data.session
  } catch (error) {
    logger.error("Error checking session validity:", error)
    return false
  }
}

// Get the current session expiration time
export async function getSessionExpiration() {
  if (typeof window === "undefined") return null

  try {
    const supabase = getSupabaseClient()
    const { data } = await supabase.auth.getSession()

    if (!data.session) return null

    return new Date(data.session.expires_at! * 1000)
  } catch (error) {
    logger.error("Error getting session expiration:", error)
    return null
  }
}
