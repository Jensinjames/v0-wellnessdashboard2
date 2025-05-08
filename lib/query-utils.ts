"import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { getCacheItem, setCacheItem } from "./cache-utils"

// Helper to generate a cache key
export function generateCacheKey(table: string, query: string, params?: Record<string, any>): string {
  const paramsString = params ? JSON.stringify(params) : ""
  return `${table}:${query}:${paramsString}`
}

// Helper to create a selective query builder
export function createSelectQuery<T>(client: SupabaseClient<Database>, table: string, columns: string[]) {
  return client.from(table).select(columns.join(","))
}

// Type for query options
export interface QueryOptions {
  cacheKey?: string
  cacheTTL?: number
  bypassCache?: boolean
  columns?: string[]
  debug?: boolean
}

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
  set<T>(key: string, data: T, expiryMs: number): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: expiryMs,
      }
      localStorage.setItem(key, JSON.stringify(cacheItem))
      console.log(`Cache set: ${key}`)
    } catch (error) {
      console.error("Error setting cache item:", error)
    }
  }

  // Get a value from the cache
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const cacheItem: CacheItem<T> = JSON.parse(item)
      const now = Date.now()

      // Check if the item has expired
      if (now - cacheItem.timestamp > cacheItem.expiry) {
        localStorage.removeItem(key)
        console.log(`Cache expired: ${key}`)
        return null
      }

      console.log(`Cache hit: ${key}`)
      return cacheItem.data
    } catch (error) {
      console.error("Error getting cache item:", error)
      return null
    }
  }

  // Remove a value from the cache
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
      console.log(`Cache removed: ${key}`)
    } catch (error) {
      console.error("Error removing cache item:", error)
    }
  }

  // Clear all values from the cache
  clear(): void {
    try {
      localStorage.clear()
      console.log("Cache cleared")
    } catch (error) {
      console.error("Error clearing cache:", error)
    }
  }

  // Clear all values that match a pattern
  clearPattern(pattern: string): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key)
        }
      })
      console.log(`Cache cleared for pattern: ${pattern}`)
    } catch (error) {
      console.error("Error clearing cache by pattern:", error)
    }
  }

  // Get cache stats
  getStats(): { size: number; entries: { key: string; expiresIn: number }[] } {
    const now = Date.now()
    const entries = Object.keys(localStorage).map((key) => {
      try {
        const item = localStorage.getItem(key)
        if (!item) return null

        const cacheItem: CacheItem<unknown> = JSON.parse(item)
        return {
          key,
          expiresIn: Math.max(0, Math.floor((cacheItem.expiry - now) / 1000)),
        }
      } catch (e) {
        return null
      }
    }).filter(Boolean) as { key: string; expiresIn: number }[]

    return {
      size: localStorage.length,
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

    if (this.debug) {
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

      if (this.debug) {
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
