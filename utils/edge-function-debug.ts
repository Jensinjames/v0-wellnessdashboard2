/**
 * Edge Function Debugging Utilities
 * Tools for debugging and monitoring Supabase Edge Functions
 */

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

  // Log to console based on debug level
  if (currentDebugLevel >= DebugLevel.INFO || (log.status === "error" && currentDebugLevel >= DebugLevel.ERROR)) {
    console.log(`[Edge Function] ${log.functionName} - ${log.status} (${log.duration}ms)`)

    if (currentDebugLevel >= DebugLevel.DEBUG) {
      console.log("Request:", log.request)
      console.log("Response:", log.response)

      if (log.error) {
        console.error("Error:", log.error)
      }
    }
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
  try {
    const response = await fetch(`${url}/health-check`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    return response.ok
  } catch (error) {
    console.error("Edge function availability check failed:", error)
    return false
  }
}
