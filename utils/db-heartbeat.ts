/**
 * Database Heartbeat Utility
 *
 * This utility provides a heartbeat mechanism to keep the database connection alive
 * and detect connectivity issues.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DbHeartbeat")

// Configuration
const HEARTBEAT_INTERVAL = 60000 // 1 minute
const MAX_CONSECUTIVE_FAILURES = 3

// Heartbeat state
let isHeartbeatRunning = false
let heartbeatInterval: NodeJS.Timeout | null = null
let consecutiveFailures = 0
let lastSuccessTime: number | null = null

/**
 * Start the database heartbeat
 * @param supabase The Supabase client
 * @returns A cleanup function to stop the heartbeat
 */
export function startDatabaseHeartbeat(supabase: SupabaseClient<Database>): () => void {
  if (isHeartbeatRunning) {
    logger.warn("Heartbeat already running, not starting a new one")
    return stopDatabaseHeartbeat
  }

  logger.info("Starting database heartbeat")
  isHeartbeatRunning = true
  consecutiveFailures = 0
  lastSuccessTime = null

  // Perform initial heartbeat
  performHeartbeat(supabase)

  // Set up interval for regular heartbeats
  heartbeatInterval = setInterval(() => {
    performHeartbeat(supabase)
  }, HEARTBEAT_INTERVAL)

  // Return cleanup function
  return stopDatabaseHeartbeat
}

/**
 * Stop the database heartbeat
 */
function stopDatabaseHeartbeat(): void {
  if (!isHeartbeatRunning) {
    return
  }

  logger.info("Stopping database heartbeat")

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }

  isHeartbeatRunning = false
  consecutiveFailures = 0
  lastSuccessTime = null
}

/**
 * Perform a heartbeat check
 * @param supabase The Supabase client
 */
async function performHeartbeat(supabase: SupabaseClient<Database>): Promise<void> {
  try {
    // Simple query to check if the database is responsive
    const { error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      handleHeartbeatFailure(error)
    } else {
      handleHeartbeatSuccess()
    }
  } catch (error) {
    handleHeartbeatFailure(error)
  }
}

/**
 * Handle a successful heartbeat
 */
function handleHeartbeatSuccess(): void {
  if (consecutiveFailures > 0) {
    logger.info(`Database connection restored after ${consecutiveFailures} failures`)
  }

  consecutiveFailures = 0
  lastSuccessTime = Date.now()
}

/**
 * Handle a failed heartbeat
 * @param error The error that occurred
 */
function handleHeartbeatFailure(error: any): void {
  consecutiveFailures++

  logger.warn(`Database heartbeat failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`, error)

  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    logger.error(`Database connection appears to be down after ${consecutiveFailures} consecutive failures`)

    // Here you could implement additional logic like:
    // - Showing a notification to the user
    // - Attempting to reconnect
    // - Switching to offline mode
  }
}

/**
 * Get the current heartbeat status
 * @returns The current heartbeat status
 */
export function getHeartbeatStatus(): {
  isRunning: boolean
  consecutiveFailures: number
  lastSuccessTime: number | null
} {
  return {
    isRunning: isHeartbeatRunning,
    consecutiveFailures,
    lastSuccessTime,
  }
}
