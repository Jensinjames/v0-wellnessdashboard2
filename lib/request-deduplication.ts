/**
 * Request Deduplication System
 * Prevents redundant requests for identical data
 */

import { createLogger } from "@/utils/logger"

const logger = createLogger("RequestDeduplication")

// Map to track in-flight requests
const inflightRequests = new Map<string, Promise<any>>()

// Request deduplication function
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    expiryMs?: number
    abortSignal?: AbortSignal
    debug?: boolean
  } = {},
): Promise<T> {
  const { expiryMs = 5000, abortSignal, debug = false } = options

  // Check if there's already an in-flight request with this key
  if (inflightRequests.has(key)) {
    // Return the existing promise
    if (debug) {
      logger.debug(`Reusing in-flight request for key: ${key}`)
    }
    return inflightRequests.get(key) as Promise<T>
  }

  // Create a new request promise
  const requestPromise = (async () => {
    try {
      // Check if we have an abort signal
      if (abortSignal?.aborted) {
        throw new Error("Request was aborted")
      }

      // Execute the request
      const result = await requestFn()

      // Return the result
      return result
    } finally {
      // Set a timeout to remove this request from the map
      setTimeout(() => {
        if (inflightRequests.get(key) === requestPromise) {
          inflightRequests.delete(key)
          if (debug) {
            logger.debug(`Removed request for key: ${key}`)
          }
        }
      }, expiryMs)
    }
  })()

  // Store the promise in the map
  inflightRequests.set(key, requestPromise)

  // If we have an abort signal, remove the request when aborted
  if (abortSignal) {
    abortSignal.addEventListener("abort", () => {
      inflightRequests.delete(key)
      if (debug) {
        logger.debug(`Aborted request for key: ${key}`)
      }
    })
  }

  return requestPromise
}

/**
 * Get statistics about the request deduplication system
 */
export function getRequestDeduplicationStats() {
  return {
    totalRequests: 0, // Placeholder - implement actual tracking
    deduplicatedRequests: 0, // Placeholder - implement actual tracking
    activeRequests: inflightRequests.size,
    savedNetworkRequests: 0, // Placeholder - implement actual tracking
    keys: Object.fromEntries(inflightRequests.entries()),
  }
}

/**
 * Get the request deduplication instance
 */
export function getRequestDeduplication() {
  return {
    deduplicate: deduplicateRequest,
    getStats: getRequestDeduplicationStats,
  }
}
