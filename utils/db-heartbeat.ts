/**
 * Database Heartbeat Utility
 *
 * This utility maintains a periodic connection to the database to prevent
 * connection timeouts and ensure the connection pool remains active.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DatabaseHeartbeat")

// Configuration
const HEARTBEAT_INTERVAL = 4 * 60 * 1000 // 4 minutes
const MAX_FAILURES = 3
const FAILURE_RESET_TIME = 10 * 60 * 1000 // 10 minutes

// State
let heartbeatInterval: NodeJS.Timeout | null = null
let failureCount = 0
let lastFailureTime = 0
let isActive = false
let activeClient: SupabaseClient | null = null

/**
 * Perform a simple database query to keep the connection alive
 */
async function performHeartbeat(supabase: SupabaseClient) {
  try {
    const startTime = Date.now()

    // Try a simple query that should always work
    const { data, error } = await supabase.rpc("heartbeat_check", {})

    if (error) {
      // If RPC fails, try a simple table query
      logger.debug("RPC heartbeat failed, trying table query")
      const { data: tableData, error: tableError } = await supabase.from("profiles").select("count").limit(1)

      if (tableError) {
        handleHeartbeatFailure(tableError)
        return false
      }
    }

    const duration = Date.now() - startTime
    logger.debug(`Database heartbeat successful (${duration}ms)`)

    // Reset failure count if it's been a while since the last failure
    if (failureCount > 0 && Date.now() - lastFailureTime > FAILURE_RESET_TIME) {
      failureCount = 0
      logger.info("Heartbeat failure count reset after period of stability")
    }

    return true
  } catch (error) {
    handleHeartbeatFailure(error)
    return false
  }
}

/**
 * Handle a heartbeat failure
 */
function handleHeartbeatFailure(error: any) {
  failureCount++
  lastFailureTime = Date.now()

  logger.warn(`Database heartbeat failed (attempt ${failureCount})`, { error })

  if (failureCount >= MAX_FAILURES) {
    logger.error(`Database connection appears unstable after ${failureCount} failed heartbeats`)
    // Here you could trigger additional recovery actions
  }
}

/**
 * Start the database heartbeat
 */
export function startDatabaseHeartbeat(supabase: SupabaseClient) {
  if (isActive) {
    if (activeClient === supabase) {
      logger.warn("Heartbeat already active for this client, not starting another")
      return () => {}
    } else {
      // If active with a different client, stop the current one
      stopDatabaseHeartbeat()
    }
  }

  logger.info(`Starting database heartbeat (interval: ${HEARTBEAT_INTERVAL}ms)`)
  isActive = true
  activeClient = supabase

  // Perform an immediate heartbeat
  performHeartbeat(supabase)

  // Set up the interval
  heartbeatInterval = setInterval(() => {
    performHeartbeat(supabase)
  }, HEARTBEAT_INTERVAL)

  // Return a cleanup function
  return () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
      isActive = false
      activeClient = null
    }
  }
}

/**
 * Stop the database heartbeat
 */
export function stopDatabaseHeartbeat() {
  if (heartbeatInterval) {
    logger.info("Stopping database heartbeat")
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
    isActive = false
    activeClient = null
  }
}

/**
 * Check if the heartbeat is currently active
 */
export function isHeartbeatActive() {
  return isActive
}

/**
 * Get the current heartbeat status
 */
export function getHeartbeatStatus() {
  return {
    active: isActive,
    failureCount,
    lastFailureTime: lastFailureTime > 0 ? new Date(lastFailureTime).toISOString() : null,
    timeSinceLastFailure: lastFailureTime > 0 ? Date.now() - lastFailureTime : null,
  }
}
