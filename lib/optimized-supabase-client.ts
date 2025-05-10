/**
 * Optimized Supabase Client
 * Integrates caching, deduplication, optimistic updates, and retry mechanisms
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getQueryCache } from "./query-cache"
import { getRequestDeduplication } from "./request-deduplication"
import { getOptimisticUpdates } from "./optimistic-updates"
import { getRetryMechanism, RetryMechanism } from "./retry-mechanism"
import { getRLSTelemetry } from "./rls-telemetry"
import { createLogger } from "@/utils/logger"

const logger = createLogger("OptimizedSupabase")

// Configuration
type OptimizedClientConfig = {
  caching: boolean
  deduplication: boolean
  optimisticUpdates: boolean
  retries: boolean
  telemetry: boolean
  debug: boolean
}

// Default configuration
const DEFAULT_CONFIG: OptimizedClientConfig = {
  caching: true,
  deduplication: true,
  optimisticUpdates: true,
  retries: true,
  telemetry: true,
  debug: false,
}

/**
 * Optimized Supabase Client
 * Wraps the standard Supabase client with optimization features
 */
export class OptimizedSupabaseClient {
  private supabase: ReturnType<typeof createClientComponentClient>
  private config: OptimizedClientConfig
  private cache = getQueryCache()
  private deduplication = getRequestDeduplication()
  private optimistic = getOptimisticUpdates()
  private retry = getRetryMechanism()
  private telemetry = getRLSTelemetry()

  constructor(config: Partial<OptimizedClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.supabase = createClientComponentClient()

    if (this.config.debug) {
      logger.debug("Initialized OptimizedSupabaseClient with config:", this.config)
    }
  }

  /**
   * Get the raw Supabase client
   */
  getRawClient() {
    return this.supabase
  }

  /**
   * Select data from a table with optimizations
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
      cacheTTL?: number
      cacheTags?: string[]
      deduplicate?: boolean
      retry?: boolean
      maxRetries?: number
    } = {},
  ): Promise<{ data: T | null; error: Error | null }> {
    const {
      columns = "*",
      filter = {},
      limit,
      order,
      single = false,
      cache = this.config.caching,
      cacheTTL,
      cacheTags = [table],
      deduplicate = this.config.deduplication,
      retry = this.config.retries,
      maxRetries,
    } = options

    // Start timing
    const startTime = performance.now()

    // Generate a cache key
    const cacheKey = `select:${table}:${columns}:${JSON.stringify(filter)}:${limit}:${JSON.stringify(order)}:${single}`

    // Check cache if enabled
    if (cache) {
      const cachedData = this.cache.get<{ data: T; error: null }>(cacheKey)
      if (cachedData) {
        // Record telemetry
        if (this.config.telemetry) {
          this.telemetry.recordCache(table, "select", performance.now() - startTime, true, {
            columns,
            filter,
            limit,
            order,
            single,
          })
        }

        return cachedData
      }
    }

    // Create the query function
    const queryFn = async () => {
      // Use retry mechanism if enabled
      if (retry) {
        const retryResult = await this.retry.execute(
          async () => {
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

            const { data, error } = await query

            if (error) {
              throw new Error(`Supabase error: ${error.message}`)
            }

            return { data, error: null }
          },
          {
            maxRetries: maxRetries,
            retryableErrors: RetryMechanism.isSupabaseErrorRetryable,
          },
        )

        if (retryResult.error) {
          return { data: null, error: retryResult.error }
        }

        return retryResult.data
      } else {
        // Execute without retry
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

        const { data, error } = await query

        if (error) {
          return { data: null, error: new Error(`Supabase error: ${error.message}`) }
        }

        return { data, error: null }
      }
    }

    try {
      // Use deduplication if enabled
      const result = deduplicate ? await this.deduplication.deduplicate(cacheKey, queryFn) : await queryFn()

      // Calculate duration
      const duration = performance.now() - startTime

      // Record telemetry
      if (this.config.telemetry) {
        this.telemetry.recordQuery(table, "select", duration, result.error ? "error" : "success", {
          columns,
          filter,
          limit,
          order,
          single,
          error: result.error,
        })
      }

      // Cache the result if successful and caching is enabled
      if (cache && result.data && !result.error) {
        this.cache.set(cacheKey, result, {
          ttl: cacheTTL,
          tags: cacheTags,
        })
      }

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      // Record telemetry
      if (this.config.telemetry) {
        this.telemetry.recordQuery(table, "select", duration, "error", {
          columns,
          filter,
          limit,
          order,
          single,
          error,
        })
      }

      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  /**
   * Insert data into a table with optimizations
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
      optimistic?: boolean
      retry?: boolean
      maxRetries?: number
      invalidateTags?: string[]
    } = {},
  ): Promise<{ data: T | null; error: Error | null }> {
    const {
      returning = true,
      optimistic = this.config.optimisticUpdates,
      retry = this.config.retries,
      maxRetries,
      invalidateTags = [table],
    } = options

    // Start timing
    const startTime = performance.now()

    // Create optimistic update if enabled
    let optimisticUpdate = null
    if (optimistic) {
      // Handle arrays vs single objects
      if (Array.isArray(data)) {
        // For arrays, we create multiple optimistic updates
        data.forEach((item) => {
          this.optimistic.createOptimisticInsert(table, item)
        })
      } else {
        // For single objects, create one optimistic update
        optimisticUpdate = this.optimistic.createOptimisticInsert(table, data)
      }
    }

    // Create the mutation function
    const mutationFn = async () => {
      // Use retry mechanism if enabled
      if (retry) {
        const retryResult = await this.retry.execute(
          async () => {
            let query = this.supabase.from(table).insert(data)

            if (returning) {
              query = query.select()
            }

            const { data: resultData, error } = await query

            if (error) {
              throw new Error(`Supabase error: ${error.message}`)
            }

            return { data: resultData, error: null }
          },
          {
            maxRetries: maxRetries,
            retryableErrors: RetryMechanism.isSupabaseErrorRetryable,
          },
        )

        if (retryResult.error) {
          return { data: null, error: retryResult.error }
        }

        return retryResult.data
      } else {
        // Execute without retry
        let query = this.supabase.from(table).insert(data)

        if (returning) {
          query = query.select()
        }

        const { data: resultData, error } = await query

        if (error) {
          return { data: null, error: new Error(`Supabase error: ${error.message}`) }
        }

        return { data: resultData, error: null }
      }
    }

    try {
      // Execute the mutation
      const result = await mutationFn()

      // Calculate duration
      const duration = performance.now() - startTime

      // Record telemetry
      if (this.config.telemetry) {
        this.telemetry.recordQuery(table, "insert", duration, result.error ? "error" : "success", {
          dataCount: Array.isArray(data) ? data.length : 1,
          returning,
          error: result.error,
        })
      }

      // Confirm optimistic update if successful
      if (optimistic && result.data && !result.error) {
        if (Array.isArray(data) && Array.isArray(result.data)) {
          // For arrays, match up the optimistic updates with the real data
          // This is a simplified approach - in a real app, you'd need more sophisticated matching
          result.data.forEach((item) => {
            this.optimistic.confirmUpdate(item.id, item)
          })
        } else if (optimisticUpdate && !Array.isArray(result.data)) {
          // For single objects
          this.optimistic.confirmUpdate(optimisticUpdate.id, result.data)
        }
      } else if (optimistic && result.error) {
        // Mark optimistic update as failed
        if (Array.isArray(data)) {
          // For arrays, we don't have a good way to match up the failed updates
          // In a real app, you'd need a more sophisticated approach
        } else if (optimisticUpdate) {
          this.optimistic.failUpdate(optimisticUpdate.id, result.error)
        }
      }

      // Invalidate cache tags
      if (invalidateTags.length > 0) {
        this.cache.invalidateByTags(invalidateTags)
      }

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      // Record telemetry
      if (this.config.telemetry) {
        this.telemetry.recordQuery(table, "insert", duration, "error", {
          dataCount: Array.isArray(data) ? data.length : 1,
          returning,
          error,
        })
      }

      // Mark optimistic update as failed
      if (optimistic) {
        if (Array.isArray(data)) {
          // For arrays, we don't have a good way to match up the failed updates
          // In a real app, you'd need a more sophisticated approach
        } else if (optimisticUpdate) {
          this.optimistic.failUpdate(optimisticUpdate.id, error instanceof Error ? error : new Error(String(error)))
        }
      }

      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  /**
   * Update data in a table with optimizations
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
      optimistic?: boolean
      originalData?: Record<string, any>
      retry?: boolean
      maxRetries?: number
      invalidateTags?: string[]
    } = {},
  ): Promise<{ data: T | null; error: Error | null }> {
    const {
      returning = true,
      optimistic = this.config.optimisticUpdates,
      originalData,
      retry = this.config.retries,
      maxRetries,
      invalidateTags = [table],
    } = options

    // Start timing
    const startTime = performance.now()

    // Create optimistic update if enabled
    let optimisticUpdate = null
    if (optimistic) {
      // For optimistic updates, we need an ID
      const id = filter.id || Object.values(filter)[0]
      if (id) {
        optimisticUpdate = this.optimistic.createOptimisticUpdate(table, id, data, originalData)
      }
    }

    // Create the mutation function
    const mutationFn = async () => {
      // Use retry mechanism if enabled
      if (retry) {
        const retryResult = await this.retry.execute(
          async () => {
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

            return { data: resultData, error: null }
          },
          {
            maxRetries: maxRetries,
            retryableErrors: RetryMechanism.isSupabaseErrorRetryable,
          },
        )

        if (retryResult.error) {
          return { data: null, error: retryResult.error }
        }

        return retryResult.data
      } else {
        // Execute without retry
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
          return { data: null, error: new Error(`Supabase error: ${error.message}`) }
        }

        return { data: resultData, error: null }
      }
    }

    try {
      // Execute the mutation
      const result = await mutationFn()

      // Calculate duration
      const duration = performance.now() - startTime

      // Record telemetry
      if (this.config.telemetry) {
        this.telemetry.recordQuery(table, "update", duration, result.error ? "error" : "success", {
          filter,
          returning,
          error: result.error,
        })
      }

      // Confirm optimistic update if successful
      if (optimistic && optimisticUpdate && result.data && !result.error) {
        this.optimistic.confirmUpdate(optimisticUpdate.id, Array.isArray(result.data) ? result.data[0] : result.data)
      } else if (optimistic && optimisticUpdate && result.error) {
        // Mark optimistic update as failed
        this.optimistic.failUpdate(optimisticUpdate.id, result.error)
      }

      // Invalidate cache tags
      if (invalidateTags.length > 0) {
        this.cache.invalidateByTags(invalidateTags)
      }

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      // Record telemetry
      if (this.config.telemetry) {
        this.telemetry.recordQuery(table, "update", duration, "error", {
          filter,
          returning,
          error,
        })
      }

      // Mark optimistic update as failed
      if (optimistic && optimisticUpdate) {
        this.optimistic.failUpdate(optimisticUpdate.id, error instanceof Error ? error : new Error(String(error)))
      }

      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  /**
   * Delete data from a table with optimizations
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
      optimistic?: boolean
      originalData?: Record<string, any>
      retry?: boolean
      maxRetries?: number
      invalidateTags?: string[]
    } = {},
  ): Promise<{ data: T | null; error: Error | null }> {
    const {
      returning = true,
      optimistic = this.config.optimisticUpdates,
      originalData,
      retry = this.config.retries,
      maxRetries,
      invalidateTags = [table],
    } = options

    // Start timing
    const startTime = performance.now()

    // Create optimistic update if enabled
    let optimisticUpdate = null
    if (optimistic) {
      // For optimistic deletes, we need an ID
      const id = filter.id || Object.values(filter)[0]
      if (id) {
        optimisticUpdate = this.optimistic.createOptimisticDelete(table, id, originalData)
      }
    }

    // Create the mutation function
    const mutationFn = async () => {
      // Use retry mechanism if enabled
      if (retry) {
        const retryResult = await this.retry.execute(
          async () => {
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

            return { data: resultData, error: null }
          },
          {
            maxRetries: maxRetries,
            retryableErrors: RetryMechanism.isSupabaseErrorRetryable,
          },
        )

        if (retryResult.error) {
          return { data: null, error: retryResult.error }
        }

        return retryResult.data
      } else {
        // Execute without retry
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
          return { data: null, error: new Error(`Supabase error: ${error.message}`) }
        }

        return { data: resultData, error: null }
      }
    }

    try {
      // Execute the mutation
      const result = await mutationFn()

      // Calculate duration
      const duration = performance.now() - startTime

      // Record telemetry
      if (this.config.telemetry) {
        this.telemetry.recordQuery(table, "delete", duration, result.error ? "error" : "success", {
          filter,
          returning,
          error: result.error,
        })
      }

      // Confirm optimistic update if successful
      if (optimistic && optimisticUpdate && !result.error) {
        this.optimistic.confirmUpdate(optimisticUpdate.id)
      } else if (optimistic && optimisticUpdate && result.error) {
        // Mark optimistic update as failed
        this.optimistic.failUpdate(optimisticUpdate.id, result.error)
      }

      // Invalidate cache tags
      if (invalidateTags.length > 0) {
        this.cache.invalidateByTags(invalidateTags)
      }

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      // Record telemetry
      if (this.config.telemetry) {
        this.telemetry.recordQuery(table, "delete", duration, "error", {
          filter,
          returning,
          error,
        })
      }

      // Mark optimistic update as failed
      if (optimistic && optimisticUpdate) {
        this.optimistic.failUpdate(optimisticUpdate.id, error instanceof Error ? error : new Error(String(error)))
      }

      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  /**
   * Get the query cache instance
   */
  getCache() {
    return this.cache
  }

  /**
   * Get the request deduplication instance
   */
  getDeduplication() {
    return this.deduplication
  }

  /**
   * Get the optimistic updates instance
   */
  getOptimisticUpdates() {
    return this.optimistic
  }

  /**
   * Get the retry mechanism instance
   */
  getRetryMechanism() {
    return this.retry
  }

  /**
   * Get the RLS telemetry instance
   */
  getTelemetry() {
    return this.telemetry
  }

  /**
   * Apply optimistic updates to a dataset
   * @param table Table name
   * @param data Original data array
   * @returns Data with optimistic updates applied
   */
  applyOptimisticUpdates<T extends Record<string, any>>(table: string, data: T[]): T[] {
    return this.optimistic.applyUpdates(table, data)
  }

  /**
   * Invalidate cache entries by tag
   * @param tag Tag to invalidate
   */
  invalidateCache(tag: string): number {
    return this.cache.invalidateByTag(tag)
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get statistics for all optimization systems
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      deduplication: this.deduplication.getStats(),
      optimisticUpdates: this.optimistic.getStats(),
      retry: this.retry.getStats(),
      telemetry: this.telemetry.getStats(),
    }
  }
}

// Create a singleton instance
let optimizedClientInstance: OptimizedSupabaseClient | null = null

/**
 * Get the global optimized Supabase client instance
 */
export function getOptimizedSupabaseClient(config?: Partial<OptimizedClientConfig>): OptimizedSupabaseClient {
  if (!optimizedClientInstance) {
    optimizedClientInstance = new OptimizedSupabaseClient(config)
  }
  return optimizedClientInstance
}

/**
 * Reset the optimized Supabase client (useful for testing)
 */
export function resetOptimizedSupabaseClient(): void {
  optimizedClientInstance = null
}
