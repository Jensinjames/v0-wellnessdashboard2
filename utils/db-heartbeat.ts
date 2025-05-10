/**
 * Database Heartbeat Utility
 *
 * Keeps the database connection pool warm by sending periodic lightweight queries.
 * This helps prevent cold starts that can lead to 500 errors when the pool is idle.
 */
import { getSupabaseClient } from "@/lib/supabase-client"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DBHeartbeat")
let heartbeatInterval: NodeJS.Timeout | null = null
const HEARTBEAT_INTERVAL = 60000 // 1 minute

/**
 * Start the database heartbeat
 * This should be called once during app initialization
 */
export function startDatabaseHeartbeat(): void {
  if (typeof window === "undefined") {
    // Only run on client-side
    return
  }

  if (heartbeatInterval) {
    // Already running
    return
  }

  logger.info("Starting database heartbeat")

  // Immediately send a ping to warm up the connection
  sendHeartbeat().catch((err) => {
    logger.warn("Initial heartbeat failed:", err)
  })

  // Set up the interval
  heartbeatInterval = setInterval(() => {
    sendHeartbeat().catch((err) => {
      logger.warn("Heartbeat failed:", err)
    })
  }, HEARTBEAT_INTERVAL)
}

/**
 * Stop the database heartbeat
 */
export function stopDatabaseHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
    logger.info("Database heartbeat stopped")
  }
}

/**
 * Send a single heartbeat ping to the database
 */
async function sendHeartbeat(): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    // Use a simple query instead of RPC to warm up the connection
    // This is more reliable across different Supabase configurations
    const { error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      logger.warn("Heartbeat query failed:", error)
    } else {
      logger.debug("Heartbeat successful")
    }
  } catch (error) {
    logger.warn("Heartbeat exception:", error)
    // Swallow the error to prevent it from breaking the app
  }
}

// For debugging purposes
export function getHeartbeatStatus(): { isRunning: boolean; interval: number } {
  return {
    isRunning: heartbeatInterval !== null,
    interval: HEARTBEAT_INTERVAL,
  }
}
