// Token Manager - Handles token refresh and management
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Event names for token-related events
export const TOKEN_EVENTS = {
  REFRESH_SUCCESS: "token:refresh:success",
  REFRESH_FAILURE: "token:refresh:failure",
  SESSION_EXPIRED: "token:session:expired",
  REFRESH_STARTED: "token:refresh:started",
}

// Global registry to track token managers
const tokenManagerRegistry = new Map<string, any>()

// Global singleton instance
let globalTokenManager: ReturnType<typeof createTokenManager> | null = null

// Default refresh buffer (5 minutes before expiry)
const DEFAULT_REFRESH_BUFFER = 5 * 60 * 1000

// Create a token manager for a Supabase client
function createTokenManager(supabaseClient: SupabaseClient<Database>, debugMode = false) {
  // Internal state
  let refreshTimer: NodeJS.Timeout | null = null
  let refreshInProgress = false
  let refreshQueue: Array<{
    resolve: (value: boolean) => void
    reject: (reason: any) => void
  }> = []
  let lastRefreshAttempt = 0
  let lastRefreshSuccess: number | null = null
  let refreshAttempts = 0
  let successCount = 0
  let failureCount = 0
  let currentSession: any = null
  const instanceId = `tm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Debug logging
  const debug = (...args: any[]) => {
    if (debugMode) {
      console.log(`[TokenManager:${instanceId.substring(0, 8)}]`, ...args)
    }
  }

  debug("Token manager created")

  // Register this instance
  tokenManagerRegistry.set(instanceId, {
    created: Date.now(),
    clientId: supabaseClient ? (supabaseClient as any).supabaseUrl : "unknown",
  })

  // Initialize by getting the current session
  const initialize = async () => {
    try {
      const { data } = await supabaseClient.auth.getSession()
      currentSession = data.session
      debug("Initialized with session:", currentSession ? "valid" : "none")

      if (currentSession) {
        scheduleRefresh()
      }
    } catch (error) {
      console.error("Error initializing token manager:", error)
    }
  }

  // Schedule a token refresh
  const scheduleRefresh = () => {
    if (!currentSession) return

    // Clear any existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }

    // Calculate when the token expires
    const expiresAt = currentSession.expires_at ? currentSession.expires_at * 1000 : null
    if (!expiresAt) return

    // Calculate when to refresh (5 minutes before expiry or immediately if already expired)
    const now = Date.now()
    const refreshAt = Math.max(0, expiresAt - now - DEFAULT_REFRESH_BUFFER)

    debug(
      `Token expires in ${Math.round((expiresAt - now) / 1000 / 60)} minutes, scheduling refresh in ${Math.round(refreshAt / 1000 / 60)} minutes`,
    )

    // Schedule the refresh
    refreshTimer = setTimeout(() => {
      debug("Scheduled refresh triggered")
      refreshToken()
    }, refreshAt)
  }

  // Refresh the token
  const refreshToken = async (): Promise<boolean> => {
    // If a refresh is already in progress, queue this request
    if (refreshInProgress) {
      debug("Refresh already in progress, queueing request")
      return new Promise<boolean>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })
    }

    try {
      refreshInProgress = true
      lastRefreshAttempt = Date.now()
      refreshAttempts++

      // Dispatch refresh started event
      window.dispatchEvent(
        new CustomEvent(TOKEN_EVENTS.REFRESH_STARTED, {
          detail: {
            timestamp: lastRefreshAttempt,
            attempt: refreshAttempts,
          },
        }),
      )

      debug("Refreshing token")
      const { data, error } = await supabaseClient.auth.refreshSession()

      if (error) {
        debug("Token refresh failed:", error)
        failureCount++

        // Dispatch refresh failure event
        window.dispatchEvent(
          new CustomEvent(TOKEN_EVENTS.REFRESH_FAILURE, {
            detail: {
              timestamp: Date.now(),
              error,
              attempt: refreshAttempts,
            },
          }),
        )

        // If the session is expired, dispatch session expired event
        if (error.message?.includes("expired")) {
          window.dispatchEvent(new CustomEvent(TOKEN_EVENTS.SESSION_EXPIRED))
        }

        // Process queue with failure
        processQueue(false)
        return false
      }

      // Update session and schedule next refresh
      currentSession = data.session
      lastRefreshSuccess = Date.now()
      successCount++

      // Dispatch refresh success event
      window.dispatchEvent(
        new CustomEvent(TOKEN_EVENTS.REFRESH_SUCCESS, {
          detail: {
            timestamp: lastRefreshSuccess,
            session: currentSession,
          },
        }),
      )

      debug("Token refreshed successfully")
      scheduleRefresh()

      // Process queue with success
      processQueue(true)
      return true
    } catch (error) {
      console.error("Unexpected error refreshing token:", error)
      failureCount++

      // Dispatch refresh failure event
      window.dispatchEvent(
        new CustomEvent(TOKEN_EVENTS.REFRESH_FAILURE, {
          detail: {
            timestamp: Date.now(),
            error,
            attempt: refreshAttempts,
          },
        }),
      )

      // Process queue with failure
      processQueue(false)
      return false
    } finally {
      refreshInProgress = false
    }
  }

  // Process the queue of pending refresh requests
  const processQueue = (success: boolean) => {
    const queue = [...refreshQueue]
    refreshQueue = []

    for (const { resolve } of queue) {
      resolve(success)
    }
  }

  // Force an immediate token refresh
  const forceRefresh = async (): Promise<boolean> => {
    debug("Force refresh requested")
    return refreshToken()
  }

  // Check if the token is valid
  const isTokenValid = (): boolean => {
    if (!currentSession) return false

    const expiresAt = currentSession.expires_at ? currentSession.expires_at * 1000 : null
    if (!expiresAt) return false

    return Date.now() < expiresAt
  }

  // Get token status
  const getStatus = () => {
    if (!currentSession) {
      return {
        valid: false,
        expiresSoon: false,
        expiresAt: null,
        telemetry: {
          refreshAttempts,
          lastRefreshAttempt,
          lastRefreshSuccess,
          successCount,
          failureCount,
        },
      }
    }

    const expiresAt = currentSession.expires_at ? currentSession.expires_at * 1000 : null
    const now = Date.now()
    const valid = expiresAt ? now < expiresAt : false
    const expiresSoon = expiresAt ? now > expiresAt - DEFAULT_REFRESH_BUFFER : false

    return {
      valid,
      expiresSoon,
      expiresAt,
      telemetry: {
        refreshAttempts,
        lastRefreshAttempt,
        lastRefreshSuccess,
        successCount,
        failureCount,
      },
    }
  }

  // Clean up resources
  const cleanup = () => {
    debug("Cleaning up token manager")
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }

    // Unregister this instance
    tokenManagerRegistry.delete(instanceId)
  }

  // Initialize
  initialize()

  return {
    refreshToken,
    forceRefresh,
    isTokenValid,
    getStatus,
    cleanup,
    instanceId,
  }
}

// Get the token manager (singleton pattern)
export function getTokenManager(supabaseClient: SupabaseClient<Database>, debugMode = false) {
  // If we already have a global instance, return it
  if (globalTokenManager) {
    return globalTokenManager
  }

  // Create a new instance
  globalTokenManager = createTokenManager(supabaseClient, debugMode)
  return globalTokenManager
}

// Reset the token manager (useful for testing or when auth state changes)
export function resetTokenManager() {
  if (globalTokenManager) {
    globalTokenManager.cleanup()
    globalTokenManager = null
  }
}

// Get token manager registry info (for debugging)
export function getTokenManagerRegistry() {
  return {
    count: tokenManagerRegistry.size,
    instances: Array.from(tokenManagerRegistry.entries()).map(([id, info]) => ({
      id,
      ...info,
    })),
  }
}
