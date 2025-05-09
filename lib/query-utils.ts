import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { isomorphicCache, CACHE_EXPIRY } from "./isomorphic-cache"

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

// Re-export cache expiration times
export { CACHE_EXPIRY }

// Re-export the cache for direct access
export { isomorphicCache as queryCache }

// Helper for cached read operations
export async function cachedQuery<T>(
  client: SupabaseClient<Database>,
  table: string,
  queryFn: (query: any) => Promise<{ data: T; error: any }>,
  options: QueryOptions = {},
): Promise<T | null> {
  const { cacheKey = table, cacheTTL = CACHE_EXPIRY.MEDIUM, bypassCache = false, debug = false } = options

  // Check cache first (unless bypassing)
  if (!bypassCache) {
    const cachedData = isomorphicCache.get<T>(cacheKey)
    if (cachedData) {
      if (debug) console.log(`[cachedQuery] Cache hit for ${cacheKey}`)
      return cachedData
    }
  }

  if (debug) console.log(`[cachedQuery] Cache miss for ${cacheKey}, fetching from DB`)

  // Execute the query
  const { data, error } = await queryFn(
    options.columns ? createSelectQuery(client, table, options.columns) : client.from(table),
  )

  // Handle errors
  if (error) {
    console.error(`[cachedQuery] Error querying ${table}:`, error)
    throw error
  }

  // Cache the result
  if (!bypassCache && data) {
    isomorphicCache.set(cacheKey, data, cacheTTL)
  }

  return data
}
