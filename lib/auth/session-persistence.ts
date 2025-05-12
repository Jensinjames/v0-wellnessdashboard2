import { createClient } from "@/lib/supabase-client"
import type { Session } from "@supabase/supabase-js"

// Persistence options
export type PersistenceMode = "local" | "session" | "none"

// Session persistence configuration
export interface SessionPersistenceConfig {
  /**
   * How long (in seconds) the session should persist in storage
   * Default: 7 days (604800 seconds)
   */
  maxAge?: number

  /**
   * Storage mode for persistence
   * - local: persists across browser restarts (localStorage)
   * - session: persists until browser is closed (sessionStorage)
   * - none: no persistence, session is lost on page refresh
   */
  mode?: PersistenceMode

  /**
   * Whether to automatically refresh the session when it's about to expire
   * Default: true
   */
  autoRefresh?: boolean

  /**
   * How long before expiry (in seconds) to trigger a refresh
   * Default: 5 minutes (300 seconds)
   */
  refreshThreshold?: number
}

// Default configuration
const DEFAULT_CONFIG: SessionPersistenceConfig = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  mode: "local",
  autoRefresh: true,
  refreshThreshold: 60 * 5, // 5 minutes
}

// Storage keys
const SESSION_KEY = "supabase.auth.session"
const REFRESH_TIMER_KEY = "supabase.auth.refreshTimer"

/**
 * Saves the session to the appropriate storage based on mode
 */
export function persistSession(session: Session | null, config: SessionPersistenceConfig = DEFAULT_CONFIG): void {
  const { mode = "local" } = config

  if (!session || mode === "none") {
    clearPersistedSession()
    return
  }

  const storageItem = JSON.stringify({
    session,
    expiresAt: Date.now() + (config.maxAge || DEFAULT_CONFIG.maxAge) * 1000,
  })

  if (mode === "local") {
    localStorage.setItem(SESSION_KEY, storageItem)
  } else if (mode === "session") {
    sessionStorage.setItem(SESSION_KEY, storageItem)
  }

  // Set up auto-refresh if enabled
  if (config.autoRefresh) {
    setupAutoRefresh(session, config)
  }
}

/**
 * Retrieves the persisted session from storage
 */
export function getPersistedSession(config: SessionPersistenceConfig = DEFAULT_CONFIG): Session | null {
  const { mode = "local" } = config

  if (mode === "none" || typeof window === "undefined") {
    return null
  }

  let storageItem: string | null = null

  if (mode === "local") {
    storageItem = localStorage.getItem(SESSION_KEY)
  } else if (mode === "session") {
    storageItem = sessionStorage.getItem(SESSION_KEY)
  }

  if (!storageItem) {
    return null
  }

  try {
    const { session, expiresAt } = JSON.parse(storageItem)

    // Check if session has expired in storage
    if (expiresAt < Date.now()) {
      clearPersistedSession()
      return null
    }

    return session
  } catch (error) {
    console.error("Error parsing persisted session:", error)
    clearPersistedSession()
    return null
  }
}

/**
 * Clears the persisted session from all storage types
 */
export function clearPersistedSession(): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)

  // Clear any refresh timers
  const timerId = localStorage.getItem(REFRESH_TIMER_KEY)
  if (timerId) {
    clearTimeout(Number.parseInt(timerId))
    localStorage.removeItem(REFRESH_TIMER_KEY)
  }
}

/**
 * Sets up automatic session refresh before expiry
 */
function setupAutoRefresh(session: Session, config: SessionPersistenceConfig): void {
  if (typeof window === "undefined") {
    return
  }

  // Clear any existing refresh timers
  const existingTimerId = localStorage.getItem(REFRESH_TIMER_KEY)
  if (existingTimerId) {
    clearTimeout(Number.parseInt(existingTimerId))
  }

  // Calculate when to refresh
  const expiresAt = new Date(session.expires_at || "").getTime()
  const refreshThreshold = (config.refreshThreshold || DEFAULT_CONFIG.refreshThreshold) * 1000
  const refreshAt = expiresAt - refreshThreshold
  const timeUntilRefresh = refreshAt - Date.now()

  // Only set up refresh if the session will expire in the future
  if (timeUntilRefresh <= 0) {
    return
  }

  // Set up the refresh timer
  const timerId = setTimeout(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("Error refreshing session:", error)
        clearPersistedSession()
        return
      }

      if (data.session) {
        persistSession(data.session, config)
      }
    } catch (error) {
      console.error("Unexpected error during session refresh:", error)
    }
  }, timeUntilRefresh)

  // Store the timer ID so we can clear it later if needed
  localStorage.setItem(REFRESH_TIMER_KEY, timerId.toString())
}

/**
 * Initializes session persistence with the given configuration
 */
export function initSessionPersistence(config: SessionPersistenceConfig = DEFAULT_CONFIG): void {
  if (typeof window === "undefined") {
    return
  }

  // Try to get an existing session from storage
  const persistedSession = getPersistedSession(config)

  if (persistedSession) {
    // If we have a persisted session, set it in Supabase
    const supabase = createClient()
    supabase.auth.setSession({
      access_token: persistedSession.access_token,
      refresh_token: persistedSession.refresh_token,
    })
  }
}
