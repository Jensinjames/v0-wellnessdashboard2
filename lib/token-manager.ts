/**
 * Token Manager
 * Handles JWT token refresh, validation, and expiration
 */
"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Event names for token-related events
export const TOKEN_EVENTS = {
  REFRESH_SUCCESS: "supabase:token:refresh:success",
  REFRESH_FAILURE: "supabase:token:refresh:failure",
  SESSION_EXPIRED: "supabase:session:expired",
}

// Token manager state
interface TokenManagerState {
  valid: boolean
  expiresSoon: boolean
  expiresAt: number | null
  telemetry: {
    refreshAttempts: number
    successCount: number
    failureCount: number
    lastRefreshSuccess: number | null
    lastRefreshFailure: number | null
  }
}

// Singleton instance
let tokenManagerInstance: ReturnType<typeof createTokenManager> | null = null

/**
 * Creates a token manager for handling JWT token refresh and validation
 */
function createTokenManager(client: SupabaseClient<Database>, debug = false) {
  // Token state
  const state: TokenManagerState = {
    valid: false,
    expiresSoon: false,
    expiresAt: null,
    telemetry: {
      refreshAttempts: 0,
      successCount: 0,
      failureCount: 0,
      lastRefreshSuccess: null,
      lastRefreshFailure: null,
    },
  }

  // Debug logging
  const log = (...args: any[]) => {
    if (debug) {
      console.log("[TokenManager]", ...args)
    }
  }

  // Refresh timer
  let refreshTimer: NodeJS.Timeout | null = null

  // Initialize token state
  const initialize = async () => {
    try {
      const { data, error } = await client.auth.getSession()

      if (error) {
        log("Error getting session:", error)
        state.valid = false
        return false
      }

      if (!data.session) {
        log("No session found")
        state.valid = false
        return false
      }

      // Extract expiration from JWT
      const { session } = data
      const expiresAt = session.expires_at ? session.expires_at * 1000 : null // Convert to milliseconds

      state.valid = true
      state.expiresAt = expiresAt
      state.expiresSoon = expiresAt ? expiresAt - Date.now() < 5 * 60 * 1000 : false // 5 minutes

      log("Session initialized, expires at:", new Date(expiresAt || 0).toISOString())

      // Schedule refresh if needed
      scheduleRefresh()

      return true
    } catch (error) {
      log("Error initializing token manager:", error)
      state.valid = false
      return false
    }
  }

  // Schedule token refresh
  const scheduleRefresh = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }

    if (!state.expiresAt) {
      log("No expiration time, not scheduling refresh")
      return
    }

    const now = Date.now()
    const timeUntilExpiry = state.expiresAt - now

    if (timeUntilExpiry <= 0) {
      log("Token already expired")
      state.valid = false
      dispatchEvent(TOKEN_EVENTS.SESSION_EXPIRED, { expiresAt: state.expiresAt })
      return
    }

    // Refresh at 80% of the token's lifetime
    const refreshAt = Math.max(timeUntilExpiry * 0.2, 60000) // At least 1 minute before expiry
    const refreshIn = timeUntilExpiry - refreshAt

    log(`Scheduling refresh in ${Math.round(refreshIn / 1000)}s (${new Date(now + refreshIn).toISOString()})`)

    refreshTimer = setTimeout(() => {
      log("Executing scheduled token refresh")
      refreshToken()
    }, refreshIn)
  }

  // Refresh the token
  const refreshToken = async () => {
    try {
      log("Refreshing token")
      state.telemetry.refreshAttempts++

      const { data, error } = await client.auth.refreshSession()

      if (error) {
        log("Error refreshing token:", error)
        state.telemetry.failureCount++
        state.telemetry.lastRefreshFailure = Date.now()
        dispatchEvent(TOKEN_EVENTS.REFRESH_FAILURE, { error })
        return false
      }

      if (!data.session) {
        log("No session returned from refresh")
        state.telemetry.failureCount++
        state.telemetry.lastRefreshFailure = Date.now()
        dispatchEvent(TOKEN_EVENTS.REFRESH_FAILURE, { error: "No session returned" })
        return false
      }

      // Update state with new session data
      const { session } = data
      const expiresAt = session.expires_at ? session.expires_at * 1000 : null // Convert to milliseconds

      state.valid = true
      state.expiresAt = expiresAt
      state.expiresSoon = expiresAt ? expiresAt - Date.now() < 5 * 60 * 1000 : false // 5 minutes
      state.telemetry.successCount++
      state.telemetry.lastRefreshSuccess = Date.now()

      log("Token refreshed successfully, new expiry:", new Date(expiresAt || 0).toISOString())

      // Schedule next refresh
      scheduleRefresh()

      // Dispatch success event
      dispatchEvent(TOKEN_EVENTS.REFRESH_SUCCESS, { expiresAt })

      return true
    } catch (error) {
      log("Unexpected error refreshing token:", error)
      state.telemetry.failureCount++
      state.telemetry.lastRefreshFailure = Date.now()
      dispatchEvent(TOKEN_EVENTS.REFRESH_FAILURE, { error })
      return false
    }
  }

  // Force a token refresh
  const forceRefresh = async () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }

    return refreshToken()
  }

  // Check if token is valid
  const isTokenValid = () => {
    if (!state.valid || !state.expiresAt) {
      return false
    }

    return state.expiresAt > Date.now()
  }

  // Get token status
  const getStatus = () => {
    return { ...state }
  }

  // Clean up resources
  const cleanup = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  // Helper to dispatch custom events
  const dispatchEvent = (eventName: string, detail: any) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent(eventName, { detail })
      window.dispatchEvent(event)
    }
  }

  // Initialize on creation
  initialize()

  // Return public API
  return {
    initialize,
    refreshToken,
    forceRefresh,
    isTokenValid,
    getStatus,
    cleanup,
  }
}

/**
 * Get the token manager singleton
 */
export function getTokenManager(client: SupabaseClient<Database>, debug = false) {
  if (!tokenManagerInstance) {
    tokenManagerInstance = createTokenManager(client, debug)
  }
  return tokenManagerInstance
}

/**
 * Reset the token manager singleton
 */
export function resetTokenManager() {
  if (tokenManagerInstance) {
    tokenManagerInstance.cleanup()
    tokenManagerInstance = null
  }
}
