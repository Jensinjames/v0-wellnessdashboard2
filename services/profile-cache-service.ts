import type { UserProfile } from "@/types/profile"

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class ProfileCacheService {
  private cache = new Map<string, CacheEntry<UserProfile>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes in milliseconds
  private maxEntries = 100 // Maximum number of profiles to cache

  /**
   * Get a profile from the cache
   */
  get(userId: string): UserProfile | null {
    const entry = this.cache.get(userId)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId)
      return null
    }

    return entry.data
  }

  /**
   * Store a profile in the cache
   */
  set(userId: string, profile: UserProfile, ttl: number = this.defaultTTL): void {
    // Enforce cache size limit
    if (this.cache.size >= this.maxEntries) {
      // Remove oldest entry
      let oldestId: string | null = null
      let oldestTimestamp = Number.POSITIVE_INFINITY

      this.cache.forEach((entry, id) => {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp
          oldestId = id
        }
      })

      if (oldestId) {
        this.cache.delete(oldestId)
      }
    }

    const now = Date.now()

    this.cache.set(userId, {
      data: profile,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  /**
   * Remove a profile from the cache
   */
  invalidate(userId: string): void {
    this.cache.delete(userId)
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Set the default TTL for cache entries
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
  }

  /**
   * Set the maximum number of entries in the cache
   */
  setMaxEntries(max: number): void {
    this.maxEntries = max

    // If the cache is already larger than the new max, trim it
    if (this.cache.size > max) {
      // Get all entries sorted by timestamp
      const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)

      // Remove oldest entries until we're under the limit
      for (let i = 0; i < entries.length - max; i++) {
        this.cache.delete(entries[i][0])
      }
    }
  }
}

// Create a singleton instance
const profileCache = new ProfileCacheService()

export default profileCache
