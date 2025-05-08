/**
 * Edge Function Debugging Utilities
 * Tools for debugging and monitoring Supabase Edge Functions
 */
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for edge functions
const logger = createLogger("EdgeFunction")

// Debug levels
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

// Current debug level (can be set via environment variable)
const currentDebugLevel = process.env.EDGE_FUNCTION_DEBUG_LEVEL
  ? Number.parseInt(process.env.EDGE_FUNCTION_DEBUG_LEVEL, 10)
  : DebugLevel.ERROR

// Edge function request log
interface EdgeFunctionLog {
  timestamp: number
  functionName: string
  status: "success" | "error"
  duration: number
  request?: any
  response?: any
  error?: any
}

// Store logs in memory (limited size)
const MAX_LOGS = 50
const edgeFunctionLogs: EdgeFunctionLog[] = []

/**
 * Log an edge function call
 */
export function logEdgeFunctionCall(log: EdgeFunctionLog): void {
  // Add to beginning of array
  edgeFunctionLogs.unshift(log)

  // Trim if too large
  if (edgeFunctionLogs.length > MAX_LOGS) {
    edgeFunctionLogs.length = MAX_LOGS
  }

  // Log using the centralized logger
  if (log.status === "success") {
    logger.info(
      `${log.functionName} completed in ${log.duration}ms`,
      { request: log.request, response: log.response },
      { functionName: log.functionName, duration: log.duration },
    )
  } else {
    logger.error(
      `${log.functionName} failed after ${log.duration}ms`,
      { request: log.request, response: log.response },
      log.error,
      { functionName: log.functionName, duration: log.duration },
    )
  }
}

/**
 * Get edge function logs
 */
export function getEdgeFunctionLogs(): EdgeFunctionLog[] {
  return [...edgeFunctionLogs]
}

/**
 * Clear edge function logs
 */
export function clearEdgeFunctionLogs(): void {
  edgeFunctionLogs.length = 0
  logger.info("Edge function logs cleared")
}

/**
 * Measure the execution time of an edge function call
 */
export async function measureEdgeFunctionCall<T>(
  functionName: string,
  fn: () => Promise<T>,
  request?: any,
): Promise<T> {
  const startTime = performance.now()

  logger.debug(`Starting edge function call: ${functionName}`, request)

  try {
    const response = await fn()
    const duration = performance.now() - startTime

    logEdgeFunctionCall({
      timestamp: Date.now(),
      functionName,
      status: "success",
      duration,
      request,
      response,
    })

    return response
  } catch (error) {
    const duration = performance.now() - startTime

    logEdgeFunctionCall({
      timestamp: Date.now(),
      functionName,
      status: "error",
      duration,
      request,
      error,
    })

    throw error
  }
}

/**
 * Check if an edge function is available
 */
export async function checkEdgeFunctionAvailability(url: string): Promise<boolean> {
  logger.debug(`Checking edge function availability: ${url}`)

  try {
    const response = await fetch(`${url}/health-check`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const available = response.ok
    logger.info(
      `Edge function availability check: ${available ? "Available" : "Unavailable"}`,
      { url, status: response.status },
      { url },
    )

    return available
  } catch (error) {
    logger.error("Edge function availability check failed", { url }, error, { url })
    return false
  }
}
