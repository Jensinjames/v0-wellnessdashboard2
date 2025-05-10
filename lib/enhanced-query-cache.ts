/**
 * Enhanced Query Cache System
 * Provides intelligent caching for Supabase queries with automatic invalidation
 */
import { createLogger } from "@/utils/logger"
import { safeDevLog } from "@/utils/safe-console"

const logger = createLogger("EnhancedQueryCache")

// Cache entry type with metadata
export type CacheEntry<T> = {
  data: T
  timestamp: number
  expiresAt: number
  tags: string[]
  queryKey: string
  queryParams?: Record<string, any>
  lastAccessed: number
  accessCount: number
}

// Cache configuration with advanced options
export type CacheConfig = {
  defaultTTL: number // Default time-to-live in milliseconds
  maxSize: number // Maximum number of entries in the cache
  staleWhileRevalidate: boolean // Return stale data while fetching fresh data
  staleTime: number // Time in ms before data is considered stale
  persistToStorage: boolean // Whether to persist cache to localStorage
  storageKey: string // Key to use for localStorage
  debug: boolean // Enable debug logging
  priorityFunction: (entry: CacheEntry<any>) => number // Function to determine cache entry priority
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // 100 entries
  staleWhileRevalidate: true,
  staleTime: 60 * 1000, // 1 minute
  persistToStorage: typeof window !== "undefined",
  storageKey: "supabase_query_cache",
  debug: false,
  priorityFunction: (entry) => {
    // Default priority function based on recency and frequency
    const recency = Date.now() - entry.lastAccessed
    const frequency = entry.accessCount
    return frequency / (recency + 1) // Higher value = higher priority
  },
}

// Cache statistics with detailed metrics
export type CacheStats = {
  size: number
  hits: number
  misses: number
  staleHits: number
  expired: number
  evictions: number
  writes: number
  bytesUsed: number
  oldestEntry: number | null
  newestEntry: number | null
  averageAccessCount: number
  hitRate: number
}

/**
 * Enhanced Query Cache class
 * Provides methods for caching and retrieving query results with advanced features
 */
export class EnhancedQueryCache {
  private cache: Map<string, CacheEntry<any>>
  private config: CacheConfig
  private stats: CacheStats
  private tagMap: Map<string, Set<string>> // Maps tags to cache keys
  private revalidationQueue: Set<string> // Queue of keys to revalidate
  private revalidationInProgress = false
  private revalidationCallbacks: Map<string, ((data: any) => void)[]> = new Map()

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.cache = new Map()
    this.tagMap = new Map()
    this.revalidationQueue = new Set()
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      staleHits: 0,
      expired: 0,
      evictions: 0,
      writes: 0,
      bytesUsed: 0,
      oldestEntry: null,
      newestEntry: null,
      averageAccessCount: 0,
      hitRate: 0,
    }

    // Load from localStorage if enabled
    if (this.config.persistToStorage && typeof window !== "undefined") {
      this.loadFromStorage()

      // Set up periodic cleanup and storage sync
      setInterval(() => {
        this.cleanup()
        this.saveToStorage()
      }, 60 * 1000) // Every minute
    } else if (typeof window !== "undefined") {
      // Just set up cleanup if not persisting
      setInterval(() => this.cleanup(), 60 * 1000)
    }
  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @param options Additional options
   * @returns Cached data or null if not found or expired
   */
  get<T>(
    key: string,
    options: {
      allowStale?: boolean
      revalidate?: boolean
      revalidateCallback?: (data: T) => void
    } = {},
  ): { data: T | null; isStale: boolean } {
    const { allowStale = this.config.staleWhileRevalidate, revalidate = false, revalidateCallback } = options
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      if (this.config.debug) {
        safeDevLog(`Cache miss: ${key}`)
      }
      return { data: null, isStale: false }
    }

    const now = Date.now()

    // Update access metadata
    entry.lastAccessed = now
    entry.accessCount++

    // Check if expired
    if (entry.expiresAt < now) {
      // Entry has expired
      if (!allowStale) {
        this.cache.delete(key)
        this.removeKeyFromTags(key)
        this.stats.expired++
        this.stats.size = this.cache.size
        if (this.config.debug) {
          safeDevLog(`Cache expired: ${key}`)
        }
        return { data: null, isStale: false }
      }

      // Return stale data if allowed
      this.stats.staleHits++
      if (this.config.debug) {
        safeDevLog(`Cache stale hit: ${key}`)
      }

      // Queue for revalidation if requested
      if (revalidate) {
        this.queueForRevalidation(key)
        if (revalidateCallback) {
          if (!this.revalidationCallbacks.has(key)) {
            this.revalidationCallbacks.set(key, [])
          }
          this.revalidationCallbacks.get(key)?.push(revalidateCallback as any)
        }
      }

      return { data: entry.data as T, isStale: true }
    }

    // Check if stale (but not expired)
    const isStale = now - entry.timestamp > this.config.staleTime

    // Queue for revalidation if stale and revalidate requested
    if (isStale && revalidate) {
      this.queueForRevalidation(key)
      if (revalidateCallback) {
        if (!this.revalidationCallbacks.has(key)) {
          this.revalidationCallbacks.set(key, [])
        }
        this.revalidationCallbacks.get(key)?.push(revalidateCallback as any)
      }
    }

    // Cache hit
    this.stats.hits++
    if (this.config.debug) {
      safeDevLog(`Cache hit: ${key}${isStale ? " (stale)" : ""}`)
    }

    return { data: entry.data as T, isStale }
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
      queryParams?: Record<string, any>
    } = {},
  ): void {
    const ttl = options.ttl || this.config.defaultTTL
    const tags = options.tags || []
    const queryParams = options.queryParams

    // Ensure we don't exceed max size
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLowPriority()
    }

    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      tags,
      queryKey: key,
      queryParams,
      lastAccessed: now,
      accessCount: 1,
    }

    this.cache.set(key, entry)
    this.stats.size = this.cache.size
    this.stats.writes++

    // Update bytesUsed (approximate)
    try {
      const jsonSize = JSON.stringify(data).length * 2 // Rough estimate of bytes
      this.stats.bytesUsed += jsonSize
    } catch (e) {
      // Ignore serialization errors
    }

    // Add key to tag maps
    tags.forEach((tag) => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set())
      }
      this.tagMap.get(tag)?.add(key)
    })

    // Update stats
    this.updateTimestampStats()

    if (this.config.debug) {
      safeDevLog(`Cache set: ${key}, expires in ${ttl}ms, tags: ${tags.join(", ")}`)
    }

    // Process revalidation callbacks if this was a revalidation
    if (this.revalidationCallbacks.has(key)) {
      const callbacks = this.revalidationCallbacks.get(key) || []
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (e) {
          console.error("Error in revalidation callback:", e)
        }
      })
      this.revalidationCallbacks.delete(key)
    }

    // Save to storage if enabled
    if (this.config.persistToStorage) {
      this.debouncedSaveToStorage()
    }
  }

  /**
   * Delete an item from the cache
   * @param key Cache key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const deleted = this.cache.delete(key)
    if (deleted) {
      this.removeKeyFromTags(key)
      this.stats.size = this.cache.size

      // Update bytesUsed (approximate)
      try {
        const jsonSize = JSON.stringify(entry.data).length * 2
        this.stats.bytesUsed = Math.max(0, this.stats.bytesUsed - jsonSize)
      } catch (e) {
        // Ignore serialization errors
      }

      this.updateTimestampStats()

      if (this.config.debug) {
        safeDevLog(`Cache delete: ${key}`)
      }

      // Save to storage if enabled
      if (this.config.persistToStorage) {
        this.debouncedSaveToStorage()
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
      if (this.delete(key)) {
        count++
      }
    })

    // Clear the tag set
    this.tagMap.delete(tag)

    if (this.config.debug && count > 0) {
      safeDevLog(`Invalidated ${count} entries by tag: ${tag}`)
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
   * Invalidate cache entries by query parameters
   * @param params Query parameters to match
   */
  invalidateByParams(params: Record<string, any>): number {
    let count = 0

    this.cache.forEach((entry, key) => {
      if (!entry.queryParams) return

      // Check if all params match
      const matches = Object.entries(params).every(([paramKey, paramValue]) => {
        return entry.queryParams?.[paramKey] === paramValue
      })

      if (matches) {
        if (this.delete(key)) {
          count++
        }
      }
    })

    if (this.config.debug && count > 0) {
      safeDevLog(`Invalidated ${count} entries by params: ${JSON.stringify(params)}`)
    }

    return count
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear()
    this.tagMap.clear()
    this.stats.size = 0
    this.stats.bytesUsed = 0
    this.updateTimestampStats()

    if (this.config.debug) {
      safeDevLog("Cache cleared")
    }

    // Save to storage if enabled
    if (this.config.persistToStorage) {
      this.debouncedSaveToStorage()
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    // Calculate hit rate
    const totalRequests = this.stats.hits + this.stats.misses
    this.stats.hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    // Calculate average access count
    let totalAccessCount = 0
    this.cache.forEach((entry) => {
      totalAccessCount += entry.accessCount
    })
    this.stats.averageAccessCount = this.stats.size > 0 ? totalAccessCount / this.stats.size : 0

    return { ...this.stats }
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get all cache entries
   */
  getEntries(): Array<[string, CacheEntry<any>]> {
    return Array.from(this.cache.entries())
  }

  /**
   * Get all tags
   */
  getTags(): string[] {
    return Array.from(this.tagMap.keys())
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
    this.updateTimestampStats()

    if (this.config.debug && expiredCount > 0) {
      safeDevLog(`Cleaned up ${expiredCount} expired entries`)
    }

    // Save to storage if enabled and entries were removed
    if (this.config.persistToStorage && expiredCount > 0) {
      this.debouncedSaveToStorage()
    }
  }

  /**
   * Evict low priority entries from the cache
   */
  private evictLowPriority(): void {
    if (this.cache.size === 0) return

    // Calculate priorities for all entries
    const priorities: Array<{ key: string; priority: number }> = []

    this.cache.forEach((entry, key) => {
      const priority = this.config.priorityFunction(entry)
      priorities.push({ key, priority })
    })

    // Sort by priority (ascending)
    priorities.sort((a, b) => a.priority - b.priority)

    // Evict the lowest priority entry
    const lowest = priorities[0]
    if (lowest) {
      this.delete(lowest.key)
      this.stats.evictions++

      if (this.config.debug) {
        safeDevLog(`Evicted low priority entry: ${lowest.key}`)
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

  /**
   * Update timestamp statistics
   */
  private updateTimestampStats(): void {
    let oldest = Number.MAX_SAFE_INTEGER
    let newest = 0

    this.cache.forEach((entry) => {
      if (entry.timestamp < oldest) {
        oldest = entry.timestamp
      }
      if (entry.timestamp > newest) {
        newest = entry.timestamp
      }
    })

    this.stats.oldestEntry = this.cache.size > 0 ? oldest : null
    this.stats.newestEntry = this.cache.size > 0 ? newest : null
  }

  /**
   * Queue a key for revalidation
   */
  private queueForRevalidation(key: string): void {
    this.revalidationQueue.add(key)

    // Start processing the queue if not already in progress
    if (!this.revalidationInProgress) {
      this.processRevalidationQueue()
    }
  }

  /**
   * Process the revalidation queue
   */
  private async processRevalidationQueue(): Promise<void> {
    if (this.revalidationQueue.size === 0 || this.revalidationInProgress) {
      return
    }

    this.revalidationInProgress = true

    // Process each key in the queue
    // Note: In a real implementation, you would need to provide the actual
    // revalidation logic based on your application's needs

    this.revalidationInProgress = false

    // If there are still items in the queue, process them
    if (this.revalidationQueue.size > 0) {
      this.processRevalidationQueue()
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined" || !this.config.persistToStorage) return

    try {
      // Only save essential data to reduce storage size
      const storageData: Record<string, any> = {}

      this.cache.forEach((entry, key) => {
        storageData[key] = {
          data: entry.data,
          timestamp: entry.timestamp,
          expiresAt: entry.expiresAt,
          tags: entry.tags,
          queryParams: entry.queryParams,
        }
      })

      localStorage.setItem(this.config.storageKey, JSON.stringify(storageData))

      if (this.config.debug) {
        safeDevLog(`Saved cache to localStorage (${Object.keys(storageData).length} entries)`)
      }
    } catch (e) {
      console.error("Error saving cache to localStorage:", e)
    }
  }

  // Debounced version of saveToStorage to prevent excessive writes
  private debouncedSaveToStorage = (() => {
    let timeout: NodeJS.Timeout | null = null
    return () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        this.saveToStorage()
        timeout = null
      }, 1000)
    }
  })()

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined" || !this.config.persistToStorage) return

    try {
      const storageData = localStorage.getItem(this.config.storageKey)
      if (!storageData) return

      const parsedData = JSON.parse(storageData)

      // Only load non-expired entries
      const now = Date.now()
      let loadedCount = 0

      Object.entries(parsedData).forEach(([key, value]: [string, any]) => {
        if (value.expiresAt > now) {
          const entry: CacheEntry<any> = {
            data: value.data,
            timestamp: value.timestamp,
            expiresAt: value.expiresAt,
            tags: value.tags || [],
            queryKey: key,
            queryParams: value.queryParams,
            lastAccessed: now,
            accessCount: 1,
          }

          this.cache.set(key, entry)

          // Add key to tag maps
          entry.tags.forEach((tag) => {
            if (!this.tagMap.has(tag)) {
              this.tagMap.set(tag, new Set())
            }
            this.tagMap.get(tag)?.add(key)
          })

          loadedCount++
        }
      })

      this.stats.size = this.cache.size
      this.updateTimestampStats()

      if (this.config.debug) {
        safeDevLog(`Loaded ${loadedCount} entries from localStorage`)
      }
    } catch (e) {
      console.error("Error loading cache from localStorage:", e)
    }
  }
}

// Create a singleton instance
let cacheInstance: EnhancedQueryCache | null = null

/**
 * Get the global enhanced query cache instance
 */
export function getEnhancedQueryCache(config?: Partial<CacheConfig>): EnhancedQueryCache {
  if (!cacheInstance) {
    cacheInstance = new EnhancedQueryCache(config)
  }
  return cacheInstance
}

/**
 * Reset the enhanced query cache (useful for testing)
 */
export function resetEnhancedQueryCache(): void {
  if (cacheInstance) {
    cacheInstance.clear()
  }
  cacheInstance = null
}
