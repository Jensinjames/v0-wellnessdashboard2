/**
 * Database Heartbeat Utility
 *
 * This module provides a heartbeat mechanism to keep database connections alive
 * and prevent connection pool timeouts.
 */
import { createLogger } from "@/utils/logger"
import { pingDatabase } from "@/lib/supabase-singleton-manager"

// Create a dedicated logger for heartbeat operations
const logger = createLogger("DBHeartbeat")

// Heartbeat interval in milliseconds (default: 5 minutes)
const HEARTBEAT_INTERVAL = 5 * 60 * 1000

// Track the heartbeat interval
let heartbeatInterval: NodeJS.Timeout | null = null
let isHeartbeatRunning = false
let lastHeartbeatTime: number | null = null
let heartbeatCount = 0
let successfulHeartbeats = 0
let failedHeartbeats = 0

/**
 * Start the database heartbeat
 */
export function startDatabaseHeartbeat(intervalMs = HEARTBEAT_INTERVAL): void {
  // Don't start if already running
  if (isHeartbeatRunning) {
    logger.debug("Heartbeat already running, skipping initialization")
    return
  }

  logger.info(`Starting database heartbeat with interval: ${intervalMs}ms`)
  isHeartbeatRunning = true

  // Execute heartbeat immediately
  executeHeartbeat()

  // Set up interval for future heartbeats
  heartbeatInterval = setInterval(executeHeartbeat, intervalMs)
}

/**
 * Stop the database heartbeat
 */
export function stopDatabaseHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
    isHeartbeatRunning = false
    logger.info("Database heartbeat stopped")
  }
}

/**
 * Execute a single heartbeat
 */
async function executeHeartbeat(): Promise<void> {
  try {
    heartbeatCount++
    lastHeartbeatTime = Date.now()
    logger.debug(`Executing database heartbeat #${heartbeatCount}`)

    // Ping the database
    const success = await pingDatabase()

    if (success) {
      successfulHeartbeats++
      logger.debug(`Heartbeat #${heartbeatCount} successful`)
    } else {
      failedHeartbeats++
      logger.warn(`Heartbeat #${heartbeatCount} failed`)
    }
  } catch (error) {
    failedHeartbeats++
    logger.error(`Error executing heartbeat #${heartbeatCount}:`, error)
  }
}

/**
 * Get heartbeat status
 */
export function getHeartbeatStatus(): {
  isRunning: boolean
  lastHeartbeatTime: number | null
  heartbeatCount: number
  successfulHeartbeats: number
  failedHeartbeats: number
} {
  return {
    isRunning: isHeartbeatRunning,
    lastHeartbeatTime,
    heartbeatCount,
    successfulHeartbeats,
    failedHeartbeats,
  }
}
