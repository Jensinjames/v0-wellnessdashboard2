type PendingRequest = {
  promise: Promise<any>
  timestamp: number
}

// In-memory store of pending requests
const pendingRequests = new Map<string, PendingRequest>()

// Default deduplication window in milliseconds
const DEFAULT_DEDUPLICATION_WINDOW = 2000 // 2 seconds

/**
 * Deduplicates requests with the same key within a specified time window
 * Returns the result of the first request for all duplicate requests
 */
export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    window?: number
    debug?: boolean
  } = {},
): Promise<T> {
  const { window = DEFAULT_DEDUPLICATION_WINDOW, debug = false } = options
  const now = Date.now()

  // Check if there's a pending request for this key
  const pending = pendingRequests.get(key)

  if (pending) {
    const age = now - pending.timestamp

    // If the pending request is within the deduplication window, reuse it
    if (age < window) {
      if (debug) {
        console.log(`[Deduplication] Reusing pending request for key: ${key}, age: ${age}ms`)
      }
      return pending.promise
    }
  }

  // Create a new request
  if (debug) {
    console.log(`[Deduplication] Creating new request for key: ${key}`)
  }

  // Execute the request function
  const promise = requestFn()

  // Store the pending request
  pendingRequests.set(key, {
    promise,
    timestamp: now,
  })

  // Clean up after the request completes or fails
  promise.finally(() => {
    // Only delete if this is still the stored promise
    const current = pendingRequests.get(key)
    if (current && current.promise === promise) {
      pendingRequests.delete(key)
      if (debug) {
        console.log(`[Deduplication] Cleaned up request for key: ${key}`)
      }
    }
  })

  return promise
}

/**
 * Get statistics about pending deduplicated requests
 */
export function getDeduplicationStats() {
  const now = Date.now()
  const stats = {
    pendingCount: pendingRequests.size,
    keys: {} as Record<string, { age: number }>,
  }

  for (const [key, request] of pendingRequests.entries()) {
    stats.keys[key] = {
      age: now - request.timestamp,
    }
  }

  return stats
}
