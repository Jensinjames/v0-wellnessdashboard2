type CacheEntry<T> = {
  data: T
  timestamp: number
  expiresAt: number
}

type QueryCache = {
  [key: string]: CacheEntry<any>
}

// Default cache expiration times (in milliseconds)
export const CACHE_EXPIRY = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  PERSISTENT: 24 * 60 * 60 * 1000, // 24 hours
}

class QueryCacheManager {
  private cache: QueryCache = {}
  private maxEntries: number
  private debug: boolean

  constructor(maxEntries = 100, debug = false) {
    this.maxEntries = maxEntries
    this.debug = debug
    this.cleanupInterval()
  }

  // Set a value in the cache
  set<T>(key: string, data: T, expiryMs: number = CACHE_EXPIRY.MEDIUM): void {
    const timestamp = Date.now()
    const expiresAt = timestamp + expiryMs

    this.cache[key] = {
      data,
      timestamp,
      expiresAt,
    }

    if (this.debug) {
      console.log(`[QueryCache] Set: ${key}, expires in ${expiryMs / 1000}s`)
    }

    // If we've exceeded the max entries, remove the oldest
    this.enforceMaxEntries()
  }

  // Get a value from the cache
  get<T>(key: string): T | null {
    const entry = this.cache[key]

    if (!entry) {
      if (this.debug) {
        console.log(`[QueryCache] Miss: ${key}`)
      }
      return null
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      if (this.debug) {
        console.log(`[QueryCache] Expired: ${key}`)
      }
      delete this.cache[key]
      return null
    }

    if (this.debug) {
      console.log(`[QueryCache] Hit: ${key}`)
    }

    return entry.data as T
  }

  // Remove a value from the cache
  remove(key: string): void {
    if (this.cache[key]) {
      delete this.cache[key]
      if (this.debug) {
        console.log(`[QueryCache] Removed: ${key}`)
      }
    }
  }

  // Clear all values from the cache
  clear(): void {
    this.cache = {}
    if (this.debug) {
      console.log(`[QueryCache] Cleared all entries`)
    }
  }

  // Clear all values that match a pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern)
    let count = 0

    Object.keys(this.cache).forEach((key) => {
      if (regex.test(key)) {
        delete this.cache[key]
        count++
      }
    })

    if (this.debug && count > 0) {
      console.log(`[QueryCache] Cleared ${count} entries matching pattern: ${pattern}`)
    }
  }

  // Get cache stats
  getStats(): { size: number; entries: { key: string; expiresIn: number }[] } {
    const now = Date.now()
    const entries = Object.entries(this.cache).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, Math.floor((entry.expiresAt - now) / 1000)),
    }))

    return {
      size: Object.keys(this.cache).length,
      entries,
    }
  }

  // Enforce the maximum number of entries
  private enforceMaxEntries(): void {
    const keys = Object.keys(this.cache)
    if (keys.length <= this.maxEntries) return

    // Sort entries by timestamp (oldest first)
    const sortedKeys = keys.sort((a, b) => this.cache[a].timestamp - this.cache[b].timestamp)

    // Remove oldest entries until we're under the limit
    const keysToRemove = sortedKeys.slice(0, keys.length - this.maxEntries)
    keysToRemove.forEach((key) => {
      delete this.cache[key]
    })

    if (this.debug && keysToRemove.length > 0) {
      console.log(`[QueryCache] Removed ${keysToRemove.length} oldest entries to enforce max size`)
    }
  }

  // Periodically clean up expired entries
  private cleanupInterval(): void {
    setInterval(() => {
      const now = Date.now()
      let expiredCount = 0

      Object.keys(this.cache).forEach((key) => {
        if (now > this.cache[key].expiresAt) {
          delete this.cache[key]
          expiredCount++
        }
      })

      if (this.debug && expiredCount > 0) {
        console.log(`[QueryCache] Cleanup: removed ${expiredCount} expired entries`)
      }
    }, 60000) // Run cleanup every minute
  }
}

// Export a singleton instance
export const queryCache = new QueryCacheManager(
  200, // Max 200 entries
  process.env.NODE_ENV === "development", // Debug in development
)
