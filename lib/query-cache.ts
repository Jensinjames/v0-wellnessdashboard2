/**
 * Query Cache System
 * Provides caching for Supabase queries to minimize RLS calls
 */
import { createLogger } from "@/utils/logger"

const logger = createLogger("QueryCache")

// Cache entry type
type CacheEntry<T> = {
  data: T
  timestamp: number
  expiresAt: number
  tags: string[]
}

// Cache configuration
type CacheConfig = {
  defaultTTL: number // Default time-to-live in milliseconds
  maxSize: number // Maximum number of entries in the cache
  debug: boolean // Enable debug logging
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // 1000 entries
  debug: false,
}

// Cache statistics
type CacheStats = {
  size: number
  hits: number
  misses: number
  expired: number
  evictions: number
}

/**
 * Query Cache class
 * Provides methods for caching and retrieving query results
 */
export class QueryCache {
  private cache: Map<string, CacheEntry<any>>
  private config: CacheConfig
  private stats: CacheStats
  private tagMap: Map<string, Set<string>> // Maps tags to cache keys

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.cache = new Map()
    this.tagMap = new Map()
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      expired: 0,
      evictions: 0,
    }

    // Set up periodic cleanup
    if (typeof window !== "undefined") {
      setInterval(() => this.cleanup(), 60 * 1000) // Clean up every minute
    }
  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      if (this.config.debug) {
        logger.debug(`Cache miss: ${key}`)
      }
      return null
    }

    const now = Date.now()
    if (entry.expiresAt < now) {
      // Entry has expired
      this.cache.delete(key)
      this.removeKeyFromTags(key)
      this.stats.expired++
      this.stats.size = this.cache.size
      if (this.config.debug) {
        logger.debug(`Cache expired: ${key}`)
      }
      return null
    }

    // Cache hit
    this.stats.hits++
    if (this.config.debug) {
      logger.debug(`Cache hit: ${key}`)
    }
    return entry.data as T
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param options Caching options
   */
  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number
      tags?: string[]
    } = {},
  ): void {
    const ttl = options.ttl || this.config.defaultTTL
    const tags = options.tags || []

    // Ensure we don't exceed max size
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictOldest()
    }

    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      tags,
    }

    this.cache.set(key, entry)
    this.stats.size = this.cache.size

    // Add key to tag maps
    tags.forEach((tag) => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set())
      }
      this.tagMap.get(tag)?.add(key)
    })

    if (this.config.debug) {
      logger.debug(`Cache set: ${key}, expires in ${ttl}ms, tags: ${tags.join(", ")}`)
    }
  }

  /**
   * Delete an item from the cache
   * @param key Cache key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.removeKeyFromTags(key)
      this.stats.size = this.cache.size
      if (this.config.debug) {
        logger.debug(`Cache delete: ${key}`)
      }
    }
    return deleted
  }

  /**
   * Invalidate cache entries by tag
   * @param tag Tag to invalidate
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagMap.get(tag)
    if (!keys) return 0

    let count = 0
    keys.forEach((key) => {
      if (this.cache.delete(key)) {
        count++
      }
    })

    // Clear the tag set
    this.tagMap.delete(tag)
    this.stats.size = this.cache.size

    if (this.config.debug && count > 0) {
      logger.debug(`Invalidated ${count} entries by tag: ${tag}`)
    }

    return count
  }

  /**
   * Invalidate cache entries by multiple tags
   * @param tags Tags to invalidate
   */
  invalidateByTags(tags: string[]): number {
    let count = 0
    tags.forEach((tag) => {
      count += this.invalidateByTag(tag)
    })
    return count
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear()
    this.tagMap.clear()
    this.stats.size = 0
    if (this.config.debug) {
      logger.debug("Cache cleared")
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let expiredCount = 0

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
        this.removeKeyFromTags(key)
        expiredCount++
        this.stats.expired++
      }
    })

    this.stats.size = this.cache.size

    if (this.config.debug && expiredCount > 0) {
      logger.debug(`Cleaned up ${expiredCount} expired entries`)
    }
  }

  /**
   * Evict the oldest entry from the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Number.POSITIVE_INFINITY

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.removeKeyFromTags(oldestKey)
      this.stats.evictions++
      if (this.config.debug) {
        logger.debug(`Evicted oldest entry: ${oldestKey}`)
      }
    }
  }

  /**
   * Remove a key from all tag sets
   */
  private removeKeyFromTags(key: string): void {
    this.tagMap.forEach((keys, tag) => {
      keys.delete(key)
      if (keys.size === 0) {
        this.tagMap.delete(tag)
      }
    })
  }
}

// Create a singleton instance
let cacheInstance: QueryCache | null = null

/**
 * Get the global query cache instance
 */
export function getQueryCache(config?: Partial<CacheConfig>): QueryCache {
  if (!cacheInstance) {
    cacheInstance = new QueryCache(config)
  }
  return cacheInstance
}

/**
 * Reset the query cache (useful for testing)
 */
export function resetQueryCache(): void {
  if (cacheInstance) {
    cacheInstance.clear()
  }
  cacheInstance = null
}
