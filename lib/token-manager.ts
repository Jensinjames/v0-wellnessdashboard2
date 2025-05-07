// A dedicated utility for managing authentication tokens with advanced features
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Configuration
const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000 // Refresh 5 minutes before expiry
const MAX_REFRESH_ATTEMPTS = 5
const INITIAL_BACKOFF = 1000 // 1 second
const MAX_BACKOFF = 60 * 1000 // 1 minute

// Event names for token management events
export const TOKEN_EVENTS = {
  REFRESH_SUCCESS: "token:refresh:success",
  REFRESH_FAILURE: "token:refresh:failure",
  REFRESH_ATTEMPT: "token:refresh:attempt",
  SESSION_EXPIRED: "token:session:expired",
}

// Telemetry data interface
interface TokenTelemetry {
  refreshAttempts: number
  lastRefreshSuccess: number | null
  lastRefreshFailure: number | null
  successCount: number
  failureCount: number
  averageRefreshTime: number
  cumulativeRefreshTime: number
  lastErrorMessage: string | null
}

// Status information returned by the token manager
export interface TokenStatus {
  valid: boolean
  expiresSoon: boolean
  expiresAt: number | null
  hasRefreshedRecently: boolean
  telemetry: TokenTelemetry
}

export class TokenManager {
  private supabase: SupabaseClient<Database>
  private session: Session | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private refreshAttemptTimer: NodeJS.Timeout | null = null
  private refreshing = false
  private attemptCount = 0
  private refreshQueue: Array<() => void> = []
  private lastUpdated = 0
  private debugMode = false

  // Telemetry data
  private telemetry: TokenTelemetry = {
    refreshAttempts: 0,
    lastRefreshSuccess: null,
    lastRefreshFailure: null,
    successCount: 0,
    failureCount: 0,
    averageRefreshTime: 0,
    cumulativeRefreshTime: 0,
    lastErrorMessage: null,
  }

  constructor(supabase: SupabaseClient<Database>, debug = false) {
    this.supabase = supabase
    this.debugMode = debug

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        this.session = session
        this.lastUpdated = Date.now()
        this.scheduleRefresh()
      } else if (event === "SIGNED_OUT") {
        this.session = null
        this.clearRefreshTimer()
      }
    })

    // Initialize with current session
    this.initializeSession()
  }

  private debug(...args: any[]) {
    if (this.debugMode) {
      console.log("[TokenManager]", ...args)
    }
  }

  private async initializeSession() {
    try {
      const { data } = await this.supabase.auth.getSession()
      this.session = data.session
      this.lastUpdated = Date.now()

      if (this.session) {
        this.debug("Session initialized", this.getTokenExpiryInfo())
        this.scheduleRefresh()
      }
    } catch (error) {
      console.error("Failed to initialize session:", error)
    }
  }

  // Get information about token expiry
  private getTokenExpiryInfo() {
    if (!this.session?.expires_at) {
      return { expiresAt: null, expiresIn: null, expiresSoon: false }
    }

    const expiresAt = this.session.expires_at * 1000 // Convert to ms
    const expiresIn = expiresAt - Date.now()
    const expiresSoon = expiresIn < TOKEN_REFRESH_MARGIN

    return { expiresAt, expiresIn, expiresSoon }
  }

  // Schedule token refresh based on expiry
  private scheduleRefresh() {
    this.clearRefreshTimer()

    if (!this.session?.expires_at) {
      return
    }

    const { expiresIn, expiresSoon } = this.getTokenExpiryInfo()

    if (expiresSoon) {
      // If expiring soon, refresh immediately
      this.debug("Token expiring soon, refreshing immediately")
      this.refreshToken()
    } else if (expiresIn !== null) {
      // Schedule refresh for 5 minutes before expiry
      const refreshIn = expiresIn - TOKEN_REFRESH_MARGIN
      this.debug(`Scheduling token refresh in ${Math.round(refreshIn / 1000 / 60)} minutes`)

      this.refreshTimer = setTimeout(() => {
        this.refreshToken()
      }, refreshIn)
    }
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    if (this.refreshAttemptTimer) {
      clearTimeout(this.refreshAttemptTimer)
      this.refreshAttemptTimer = null
    }
  }

  // Get exponential backoff with jitter for retries
  private getBackoffTime(attempt: number): number {
    const baseBackoff = Math.min(INITIAL_BACKOFF * Math.pow(1.5, attempt), MAX_BACKOFF)
    // Add jitter (±20%)
    return baseBackoff * (0.8 + Math.random() * 0.4)
  }

  // Refresh auth token with retries and event emission
  public async refreshToken(): Promise<boolean> {
    // If already refreshing, queue this request
    if (this.refreshing) {
      return new Promise((resolve) => {
        this.refreshQueue.push(() => resolve(this.session !== null))
      })
    }

    this.refreshing = true
    this.attemptCount = 0

    return this.attemptRefresh()
  }

  private async attemptRefresh(): Promise<boolean> {
    if (this.attemptCount >= MAX_REFRESH_ATTEMPTS) {
      this.debug(`Max refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached, giving up`)

      // Reset refreshing state and process queue
      this.refreshing = false
      this.processRefreshQueue(false)

      // Dispatch failure event
      this.dispatchEvent(TOKEN_EVENTS.SESSION_EXPIRED, {
        attempts: this.attemptCount,
        timestamp: Date.now(),
      })

      return false
    }

    this.attemptCount++
    this.telemetry.refreshAttempts++

    // Dispatch attempt event
    this.dispatchEvent(TOKEN_EVENTS.REFRESH_ATTEMPT, {
      attempt: this.attemptCount,
      timestamp: Date.now(),
    })

    const startTime = performance.now()

    try {
      this.debug(`Refreshing token (attempt ${this.attemptCount}/${MAX_REFRESH_ATTEMPTS})`)

      const { data, error } = await this.supabase.auth.refreshSession()

      const refreshTime = performance.now() - startTime

      if (error) {
        this.debug(`Token refresh failed:`, error.message)

        // Update telemetry
        this.telemetry.lastRefreshFailure = Date.now()
        this.telemetry.failureCount++
        this.telemetry.lastErrorMessage = error.message

        // Dispatch failure event
        this.dispatchEvent(TOKEN_EVENTS.REFRESH_FAILURE, {
          attempt: this.attemptCount,
          error: error.message,
          timestamp: Date.now(),
        })

        // Try again with backoff
        const backoffTime = this.getBackoffTime(this.attemptCount)
        this.debug(`Retrying in ${Math.round(backoffTime / 1000)}s`)

        this.refreshAttemptTimer = setTimeout(() => {
          this.attemptRefresh()
        }, backoffTime)

        return false
      }

      if (data.session) {
        this.debug("Token refreshed successfully")
        this.session = data.session
        this.lastUpdated = Date.now()

        // Update telemetry
        this.telemetry.lastRefreshSuccess = Date.now()
        this.telemetry.successCount++
        this.telemetry.cumulativeRefreshTime += refreshTime
        this.telemetry.averageRefreshTime = this.telemetry.cumulativeRefreshTime / this.telemetry.successCount

        // Schedule next refresh
        this.scheduleRefresh()

        // Reset refreshing state and process queue
        this.refreshing = false
        this.processRefreshQueue(true)

        // Dispatch success event
        this.dispatchEvent(TOKEN_EVENTS.REFRESH_SUCCESS, {
          expires_at: data.session.expires_at,
          refresh_time_ms: refreshTime,
          timestamp: Date.now(),
        })

        return true
      }

      // If we get here, we got no error but also no session
      this.debug("Token refresh returned no session")

      // Update telemetry
      this.telemetry.lastRefreshFailure = Date.now()
      this.telemetry.failureCount++
      this.telemetry.lastErrorMessage = "No session returned"

      // Dispatch failure event
      this.dispatchEvent(TOKEN_EVENTS.REFRESH_FAILURE, {
        attempt: this.attemptCount,
        error: "No session returned",
        timestamp: Date.now(),
      })

      // Try again with backoff
      const backoffTime = this.getBackoffTime(this.attemptCount)
      this.debug(`Retrying in ${Math.round(backoffTime / 1000)}s`)

      this.refreshAttemptTimer = setTimeout(() => {
        this.attemptRefresh()
      }, backoffTime)

      return false
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error"
      this.debug(`Exception during token refresh:`, errorMessage)

      // Update telemetry
      this.telemetry.lastRefreshFailure = Date.now()
      this.telemetry.failureCount++
      this.telemetry.lastErrorMessage = errorMessage

      // Dispatch failure event
      this.dispatchEvent(TOKEN_EVENTS.REFRESH_FAILURE, {
        attempt: this.attemptCount,
        error: errorMessage,
        timestamp: Date.now(),
      })

      // Try again with backoff
      const backoffTime = this.getBackoffTime(this.attemptCount)
      this.debug(`Retrying in ${Math.round(backoffTime / 1000)}s`)

      this.refreshAttemptTimer = setTimeout(() => {
        this.attemptRefresh()
      }, backoffTime)

      return false
    }
  }

  // Process queued refresh callbacks
  private processRefreshQueue(success: boolean) {
    const callbacks = [...this.refreshQueue]
    this.refreshQueue = []
    callbacks.forEach((callback) => callback())
  }

  // Force an immediate token refresh
  public async forceRefresh(): Promise<boolean> {
    this.clearRefreshTimer()
    return this.refreshToken()
  }

  // Check if token is valid and not expired
  public isTokenValid(): boolean {
    if (!this.session) {
      return false
    }

    // If we don't have an expires_at, we can't determine validity
    if (!this.session.expires_at) {
      return true
    }

    return Date.now() < this.session.expires_at * 1000
  }

  // Get comprehensive token status information
  public getStatus(): TokenStatus {
    const { expiresAt, expiresSoon } = this.getTokenExpiryInfo()

    return {
      valid: this.isTokenValid(),
      expiresSoon: expiresSoon || false,
      expiresAt: expiresAt,
      hasRefreshedRecently:
        this.telemetry.lastRefreshSuccess !== null && Date.now() - this.telemetry.lastRefreshSuccess < 5 * 60 * 1000, // Within last 5 minutes
      telemetry: { ...this.telemetry },
    }
  }

  // Dispatch token-related events
  private dispatchEvent(name: string, detail: any) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(name, { detail }))
    }
  }

  // Clean up resources
  public destroy() {
    this.clearRefreshTimer()
    this.session = null
    this.refreshQueue = []
  }
}

// Singleton instance
let tokenManagerInstance: TokenManager | null = null

// Get or create the token manager instance
export function getTokenManager(supabase: SupabaseClient<Database>, debug = false): TokenManager {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager(supabase, debug)
  }
  return tokenManagerInstance
}

// Reset the token manager (useful for testing or on sign out)
export function resetTokenManager() {
  if (tokenManagerInstance) {
    tokenManagerInstance.destroy()
    tokenManagerInstance = null
  }
}
