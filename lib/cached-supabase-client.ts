/**
 * Cached Supabase Client
 * Integrates the enhanced query cache with the optimized Supabase client
 */
import { getSupabaseClient } from "@/utils/supabase-client"
import { getEnhancedQueryCache } from "@/lib/enhanced-query-cache"
import { safeDevLog } from "@/utils/safe-console"

// Configuration
type CachedClientConfig = {
  defaultCacheTime: number
  defaultStaleTime: number
  debug: boolean
}

// Default configuration
const DEFAULT_CONFIG: CachedClientConfig = {
  defaultCacheTime: 5 * 60 * 1000, // 5 minutes
  defaultStaleTime: 60 * 1000, // 1 minute
  debug: false,
}

/**
 * Cached Supabase Client
 * Provides methods for querying Supabase with automatic caching
 */
export class CachedSupabaseClient {
  private supabase = getSupabaseClient()
  private cache = getEnhancedQueryCache()
  private config: CachedClientConfig

  constructor(config: Partial<CachedClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get the raw Supabase client
   */
  getRawClient() {
    return this.supabase
  }

  /**
   * Get the cache instance
   */
  getCache() {
    return this.cache
  }

  /**
   * Select data from a table with caching
   * @param table Table name
   * @param options Query options
   * @returns Promise with query result
   */
  async select<T = any>(
    table: string,
    options: {
      columns?: string
      filter?: Record<string, any>
      limit?: number
      order?: { column: string; ascending: boolean }
      single?: boolean
      cache?: boolean
      cacheTime?: number
      cacheTags?: string[]
      allowStale?: boolean
    } = {},
  ): Promise<{ data: T | null; error: Error | null; isStale: boolean }> {
    const {
      columns = "*",
      filter = {},
      limit,
      order,
      single = false,
      cache = true,
      cacheTime = this.config.defaultCacheTime,
      cacheTags = [table],
      allowStale = true,
    } = options

    // Generate a cache key
    const cacheKey = `select:${table}:${columns}:${JSON.stringify(filter)}:${limit}:${JSON.stringify(order)}:${single}`

    // Check cache if enabled
    if (cache) {
      const { data: cachedData, isStale } = this.cache.get<{ data: T; error: null }>(cacheKey, {
        allowStale,
      })

      if (cachedData && (!isStale || allowStale)) {
        if (this.config.debug) {
          safeDevLog(`Cache ${isStale ? "stale " : ""}hit: ${cacheKey}`)
        }

        return { ...cachedData, isStale }
      }
    }

    try {
      // Build the query
      let query = this.supabase.from(table).select(columns)

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value === null) {
          query = query.is(key, null)
        } else if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === "object") {
          // Handle range queries, etc.
          if ("gt" in value) query = query.gt(key, value.gt)
          if ("gte" in value) query = query.gte(key, value.gte)
          if ("lt" in value) query = query.lt(key, value.lt)
          if ("lte" in value) query = query.lte(key, value.lte)
          if ("neq" in value) query = query.neq(key, value.neq)
        } else {
          query = query.eq(key, value)
        }
      })

      // Apply limit
      if (limit) {
        query = query.limit(limit)
      }

      // Apply order
      if (order) {
        query = query.order(order.column, { ascending: order.ascending })
      }

      // Get single item if requested
      if (single) {
        query = query.single()
      }

      // Execute the query
      const { data, error } = await query

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      // Cache the result if successful and caching is enabled
      if (cache && data) {
        this.cache.set(
          cacheKey,
          { data, error: null },
          {
            ttl: cacheTime,
            tags: cacheTags,
            queryParams: { table, columns, filter, limit, order, single },
          },
        )
      }

      return { data, error: null, isStale: false }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      return {
        data: null,
        error: err,
        isStale: false,
      }
    }
  }

  /**
   * Insert data into a table with cache invalidation
   * @param table Table name
   * @param data Data to insert
   * @param options Insert options
   * @returns Promise with insert result
   */
  async insert<T = any>(
    table: string,
    data: Record<string, any> | Record<string, any>[],
    options: {
      returning?: boolean
      invalidateTags?: string[]
    } = {},
  ): Promise<{ data: T | null; error: Error | null }> {
    const { returning = true, invalidateTags = [table] } = options

    try {
      // Execute the mutation
      let query = this.supabase.from(table).insert(data)

      if (returning) {
        query = query.select()
      }

      const { data: resultData, error } = await query

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      // Invalidate cache tags
      if (invalidateTags.length > 0) {
        this.cache.invalidateByTags(invalidateTags)
      }

      return { data: resultData as T, error: null }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      return {
        data: null,
        error: err,
      }
    }
  }

  /**
   * Update data in a table with cache invalidation
   * @param table Table name
   * @param data Data to update
   * @param filter Filter to match records
   * @param options Update options
   * @returns Promise with update result
   */
  async update<T = any>(
    table: string,
    data: Record<string, any>,
    filter: Record<string, any>,
    options: {
      returning?: boolean
      invalidateTags?: string[]
    } = {},
  ): Promise<{ data: T | null; error: Error | null }> {
    const { returning = true, invalidateTags = [table] } = options

    try {
      // Execute the mutation
      let query = this.supabase.from(table).update(data)

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value === null) {
          query = query.is(key, null)
        } else if (Array.isArray(value)) {
          query = query.in(key, value)
        } else {
          query = query.eq(key, value)
        }
      })

      if (returning) {
        query = query.select()
      }

      const { data: resultData, error } = await query

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      // Invalidate cache tags
      if (invalidateTags.length > 0) {
        this.cache.invalidateByTags(invalidateTags)
      }

      return { data: resultData as T, error: null }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      return {
        data: null,
        error: err,
      }
    }
  }

  /**
   * Delete data from a table with cache invalidation
   * @param table Table name
   * @param filter Filter to match records
   * @param options Delete options
   * @returns Promise with delete result
   */
  async delete<T = any>(
    table: string,
    filter: Record<string, any>,
    options: {
      returning?: boolean
      invalidateTags?: string[]
    } = {},
  ): Promise<{ data: T | null; error: Error | null }> {
    const { returning = true, invalidateTags = [table] } = options

    try {
      // Execute the mutation
      let query = this.supabase.from(table).delete()

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value === null) {
          query = query.is(key, null)
        } else if (Array.isArray(value)) {
          query = query.in(key, value)
        } else {
          query = query.eq(key, value)
        }
      })

      if (returning) {
        query = query.select()
      }

      const { data: resultData, error } = await query

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      // Invalidate cache tags
      if (invalidateTags.length > 0) {
        this.cache.invalidateByTags(invalidateTags)
      }

      return { data: resultData as T, error: null }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      return {
        data: null,
        error: err,
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Invalidate cache entries by tag
   * @param tag Tag to invalidate
   */
  invalidateCache(tag: string): number {
    return this.cache.invalidateByTag(tag)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }
}

// Create a singleton instance
let cachedClientInstance: CachedSupabaseClient | null = null

/**
 * Get the global cached Supabase client instance
 */
export function getCachedSupabaseClient(config?: Partial<CachedClientConfig>): CachedSupabaseClient {
  if (!cachedClientInstance) {
    cachedClientInstance = new CachedSupabaseClient(config)
  }
  return cachedClientInstance
}

/**
 * Reset the cached Supabase client (useful for testing)
 */
export function resetCachedSupabaseClient(): void {
  cachedClientInstance = null
}
