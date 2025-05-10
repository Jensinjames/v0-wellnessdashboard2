// Cache expiration times (in milliseconds)
export const CACHE_EXPIRY = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
  PROFILE: 60 * 60 * 1000, // 1 hour
  CATEGORIES: 12 * 60 * 60 * 1000, // 12 hours
  GOALS: 6 * 60 * 60 * 1000, // 6 hours
  ENTRIES: 5 * 60 * 1000, // 5 minutes
}

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

interface QueryCache {
  [key: string]: CacheItem<any>
}

class IsomorphicCache {
  private cache: QueryCache = {}
  private maxEntries: number
  private debug: boolean
  private isServer: boolean

  constructor(maxEntries = 100, debug = false) {
    this.maxEntries = maxEntries
    this.debug = debug
    this.isServer = typeof window === "undefined"
    this.setupCleanup()
  }

  private setupCleanup() {
    // Only set up interval cleanup on the client
    if (!this.isServer) {
      setInterval(() => {
        this.cleanup()
      }, 60000) // Run cleanup every minute
    }
  }

  private cleanup() {
    const now = Date.now()
    let expiredCount = 0

    Object.keys(this.cache).forEach((key) => {
      const cacheItem = this.cache[key]
      if (now - cacheItem.timestamp > cacheItem.expiry) {
        delete this.cache[key]
        expiredCount++
      }
    })

    if (this.debug && expiredCount > 0) {
      console.log(`[IsomorphicCache] Cleanup: removed ${expiredCount} expired entries`)
    }
  }

  private enforceMaxEntries() {
    const keys = Object.keys(this.cache)
    if (keys.length <= this.maxEntries) return

    // Sort entries by timestamp (oldest first)
    const sortedKeys = keys.sort((a, b) => this.cache[a].timestamp - this.cache[b].timestamp)

    // Remove oldest entries until we're under the limit
    const keysToRemove = sortedKeys.slice(0, keys.length - this.maxEntries)
    keysToRemove.forEach((key) => {
      delete this.cache[key]
    })

    if (this.debug) {
      console.log(`[IsomorphicCache] Removed ${keysToRemove.length} oldest entries to enforce max size`)
    }
  }

  // Set a value in the cache
  set<T>(key: string, data: T, expiryMs: number): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: expiryMs,
      }

      this.cache[key] = cacheItem

      if (Object.keys(this.cache).length > this.maxEntries) {
        this.enforceMaxEntries()
      }

      if (this.debug) {
        console.log(`[IsomorphicCache] Set: ${key}`)
      }
    } catch (error) {
      console.error("[IsomorphicCache] Error setting cache item:", error)
    }
  }

  // Get a value from the cache
  get<T>(key: string): T | null {
    try {
      const cacheItem = this.cache[key] as CacheItem<T> | undefined
      if (!cacheItem) return null

      const now = Date.now()

      // Check if the item has expired
      if (now - cacheItem.timestamp > cacheItem.expiry) {
        delete this.cache[key]
        if (this.debug) {
          console.log(`[IsomorphicCache] Expired: ${key}`)
        }
        return null
      }

      if (this.debug) {
        console.log(`[IsomorphicCache] Hit: ${key}`)
      }
      return cacheItem.data
    } catch (error) {
      console.error("[IsomorphicCache] Error getting cache item:", error)
      return null
    }
  }

  // Remove a value from the cache
  remove(key: string): void {
    try {
      delete this.cache[key]
      if (this.debug) {
        console.log(`[IsomorphicCache] Removed: ${key}`)
      }
    } catch (error) {
      console.error("[IsomorphicCache] Error removing cache item:", error)
    }
  }

  // Clear all values from the cache
  clear(): void {
    try {
      this.cache = {}
      if (this.debug) {
        console.log("[IsomorphicCache] Cleared all")
      }
    } catch (error) {
      console.error("[IsomorphicCache] Error clearing cache:", error)
    }
  }

  // Clear all values that match a pattern
  clearPattern(pattern: string): void {
    try {
      const regex = new RegExp(pattern)
      let count = 0

      Object.keys(this.cache).forEach((key) => {
        if (regex.test(key)) {
          delete this.cache[key]
          count++
        }
      })

      if (this.debug && count > 0) {
        console.log(`[IsomorphicCache] Cleared ${count} entries matching pattern: ${pattern}`)
      }
    } catch (error) {
      console.error("[IsomorphicCache] Error clearing cache by pattern:", error)
    }
  }

  // Get cache stats
  getStats(): { size: number; entries: { key: string; expiresIn: number }[] } {
    const now = Date.now()
    const entries = Object.keys(this.cache).map((key) => {
      const cacheItem = this.cache[key]
      const expiresIn = Math.max(0, Math.floor((cacheItem.expiry - (now - cacheItem.timestamp)) / 1000))
      return { key, expiresIn }
    })

    return {
      size: Object.keys(this.cache).length,
      entries,
    }
  }
}

// Export a singleton instance
export const isomorphicCache = new IsomorphicCache(
  200, // Max 200 entries
  process.env.NODE_ENV === "development", // Debug in development
)
