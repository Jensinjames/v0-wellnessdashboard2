/**
 * Auth Service Status Checker
 * Provides utilities to check the status of the Supabase authentication service
 */
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for auth service status
const logger = createLogger("AuthServiceStatus")

// Status check result
export interface AuthServiceStatus {
  available: boolean
  latency: number | null
  error: Error | null
  timestamp: number
}

// Cache the status check result
let lastStatusCheck: AuthServiceStatus | null = null
let statusCheckPromise: Promise<AuthServiceStatus> | null = null
const STATUS_CHECK_TTL = 30000 // 30 seconds

/**
 * Check if the Supabase authentication service is available
 * This performs a lightweight request to check service status
 */
export async function checkAuthServiceStatus(forceCheck = false): Promise<AuthServiceStatus> {
  // If we have a recent status check and we're not forcing a check, return it
  if (!forceCheck && lastStatusCheck && Date.now() - lastStatusCheck.timestamp < STATUS_CHECK_TTL) {
    return lastStatusCheck
  }

  // If there's already a check in progress, return that promise
  if (statusCheckPromise) {
    return statusCheckPromise
  }

  // Start a new status check
  statusCheckPromise = performStatusCheck()

  try {
    const result = await statusCheckPromise
    lastStatusCheck = result
    return result
  } finally {
    statusCheckPromise = null
  }
}

/**
 * Perform the actual status check
 */
async function performStatusCheck(): Promise<AuthServiceStatus> {
  const startTime = Date.now()

  try {
    // Get the Supabase URL from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseUrl) {
      throw new Error("Supabase URL is not defined")
    }

    // Construct the health check URL
    // This is a lightweight endpoint that doesn't require authentication
    const healthCheckUrl = `${supabaseUrl}/auth/v1/health`

    // Set a timeout for the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // Make the request
    const response = await fetch(healthCheckUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    // Clear the timeout
    clearTimeout(timeoutId)

    // Calculate latency
    const latency = Date.now() - startTime

    // Check if the response is ok
    if (!response.ok) {
      logger.warn(`Auth service returned status ${response.status}`, { latency })
      return {
        available: false,
        latency,
        error: new Error(`Auth service returned status ${response.status}`),
        timestamp: Date.now(),
      }
    }

    // Log success
    logger.info(`Auth service is available (latency: ${latency}ms)`)

    // Return success
    return {
      available: true,
      latency,
      error: null,
      timestamp: Date.now(),
    }
  } catch (error) {
    // Calculate latency even for errors
    const latency = Date.now() - startTime

    // Log error
    logger.error(`Auth service check failed (latency: ${latency}ms)`, error)

    // Return error
    return {
      available: false,
      latency,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: Date.now(),
    }
  }
}

/**
 * Get the last known status of the auth service
 * This doesn't perform a new check
 */
export function getLastKnownStatus(): AuthServiceStatus | null {
  return lastStatusCheck
}

/**
 * Check if we should show a service status warning to the user
 * based on recent status checks
 */
export function shouldShowServiceWarning(): boolean {
  // If we don't have a status check, don't show a warning
  if (!lastStatusCheck) {
    return false
  }

  // If the service is available, don't show a warning
  if (lastStatusCheck.available) {
    return false
  }

  // If the status check is recent (within 5 minutes), show a warning
  return Date.now() - lastStatusCheck.timestamp < 5 * 60 * 1000
}
