import { v4 as uuidv4 } from "uuid"

type PendingRequest = {
  id: string
  promise: Promise<any>
  resolve: (value: any) => void
  reject: (reason: any) => void
  timestamp: number
  operation: string
}

/**
 * RequestCoordinator ensures that concurrent operations on the same resource
 * are properly sequenced to prevent race conditions.
 */
class RequestCoordinator {
  private pendingRequests: Map<string, PendingRequest[]> = new Map()
  private debug: boolean = process.env.NODE_ENV === "development"

  /**
   * Coordinates requests by key to prevent race conditions
   * @param key - Unique identifier for the resource (e.g., "profile-userId")
   * @param operation - Function that performs the actual operation
   * @param operationName - Name of the operation for debugging
   */
  async coordinate<T>(key: string, operation: () => Promise<T>, operationName = "unknown"): Promise<T> {
    const requestId = uuidv4()
    const timestamp = Date.now()

    if (this.debug) {
      console.log(`[RequestCoordinator] Starting ${operationName} (${requestId}) for ${key}`)
    }

    // Check if there are pending requests for this key
    if (!this.pendingRequests.has(key)) {
      this.pendingRequests.set(key, [])
    }

    const requests = this.pendingRequests.get(key)!

    // If there are pending requests, wait for the most recent one
    if (requests.length > 0) {
      const latestRequest = requests[requests.length - 1]
      if (this.debug) {
        console.log(
          `[RequestCoordinator] ${operationName} (${requestId}) waiting for ${latestRequest.operation} (${latestRequest.id})`,
        )
      }

      try {
        // Wait for the latest request to complete
        await latestRequest.promise
      } catch (error) {
        // Previous request failed, but we'll continue with our operation
        console.warn(
          `[RequestCoordinator] Previous request ${latestRequest.id} for ${key} failed, continuing with ${requestId}`,
        )
      }
    }

    // Create a new promise for this request
    let resolvePromise!: (value: any) => void
    let rejectPromise!: (reason: any) => void

    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })

    // Add this request to the pending requests
    const request: PendingRequest = {
      id: requestId,
      promise,
      resolve: resolvePromise,
      reject: rejectPromise,
      timestamp,
      operation: operationName,
    }

    requests.push(request)

    try {
      // Execute the operation
      const result = await operation()

      if (this.debug) {
        console.log(`[RequestCoordinator] Completed ${operationName} (${requestId}) for ${key}`)
      }

      request.resolve(result)
      return result
    } catch (error) {
      if (this.debug) {
        console.error(`[RequestCoordinator] Failed ${operationName} (${requestId}) for ${key}:`, error)
      }

      request.reject(error)
      throw error
    } finally {
      // Remove this request from the pending requests
      const index = requests.indexOf(request)
      if (index !== -1) {
        requests.splice(index, 1)
      }

      // Clean up the key if there are no more pending requests
      if (requests.length === 0) {
        this.pendingRequests.delete(key)
      }
    }
  }

  /**
   * Get statistics about pending requests
   */
  getStats() {
    const stats: Record<string, { count: number; oldestTimestamp: number; operations: string[] }> = {}

    for (const [key, requests] of this.pendingRequests.entries()) {
      if (requests.length > 0) {
        const oldestTimestamp = Math.min(...requests.map((r) => r.timestamp))
        stats[key] = {
          count: requests.length,
          oldestTimestamp,
          operations: requests.map((r) => r.operation),
        }
      }
    }

    return stats
  }
}

// Export a singleton instance
export const requestCoordinator = new RequestCoordinator()
