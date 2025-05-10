import { getClient } from "@/lib/supabase"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DBHeartbeat")

let heartbeatInterval: NodeJS.Timeout | null = null
const HEARTBEAT_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Sends a simple query to keep the database connection alive
 */
async function sendHeartbeat() {
  try {
    const supabase = getClient()
    const start = Date.now()

    // Simple query to keep the connection alive
    const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true })

    const duration = Date.now() - start

    if (error) {
      logger.error(`Database heartbeat failed (${duration}ms):`, error)
      return false
    }

    logger.debug(`Database heartbeat successful (${duration}ms)`)
    return true
  } catch (error) {
    logger.error("Database heartbeat error:", error)
    return false
  }
}

/**
 * Start the database heartbeat to keep the connection pool warm
 */
export function startDatabaseHeartbeat() {
  if (heartbeatInterval) {
    return
  }

  // Send an initial heartbeat
  sendHeartbeat()

  // Set up the interval
  heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)

  logger.info(`Database heartbeat started (interval: ${HEARTBEAT_INTERVAL / 1000}s)`)
}

/**
 * Stop the database heartbeat
 */
export function stopDatabaseHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
    logger.info("Database heartbeat stopped")
  }
}
