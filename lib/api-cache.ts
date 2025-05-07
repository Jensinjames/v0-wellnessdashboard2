import type { NextResponse } from "next/server"
import { CACHE_EXPIRY } from "./cache-utils"

type CacheEntry = {
  response: NextResponse
  timestamp: number
  expiry: number
}

// In-memory cache for API responses
const responseCache = new Map<string, CacheEntry>()

// Cache configuration by route pattern
const CACHE_CONFIG: Record<
  string,
  {
    maxAge: number
    staleWhileRevalidate?: number
    varyByQuery?: boolean
    varyByAuth?: boolean
  }
> = {
  "/api/categories": {
    maxAge: CACHE_EXPIRY.CATEGORIES,
    varyByAuth: true,
  },
  "/api/goals": {
    maxAge: CACHE_EXPIRY.GOALS,
    varyByAuth: true,
  },
  "/api/dashboard-data": {
    maxAge: CACHE_EXPIRY.SHORT,
    varyByAuth: true,
  },
  "/api/profile": {
    maxAge: CACHE_EXPIRY.PROFILE,
    varyByAuth: true,
  },
  "/api/health-check": {
    maxAge: 60 * 1000, // 1 minute
    varyByAuth: false,
  },
  "/api/debug/schema": {
    maxAge: CACHE_EXPIRY.LONG,
    varyByAuth: false,
  },
}

/**
 * Generate a cache key for an API request
 */
export function generateCacheKey(path: string, queryParams?: URLSearchParams, userId?: string | null): string {
  const config = getRouteConfig(path)

  let key = path

  // Add query parameters to the key if configured
  if (config.varyByQuery && queryParams) {
    const sortedParams = Array.from(queryParams.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([k, v]) => `${k}=${v}`)
      .join("&")

    if (sortedParams) {
      key += `?${sortedParams}`
    }
  }

  // Add user ID to the key if configured
  if (config.varyByAuth && userId) {
    key += `|user:${userId}`
  }

  return key
}

/**
 * Get cache configuration for a route
 */
function getRouteConfig(path: string) {
  // Find the matching route pattern
  const matchingPattern = Object.keys(CACHE_CONFIG).find((pattern) => {
    return path.startsWith(pattern)
  })

  // Return the config or a default
  return matchingPattern ? CACHE_CONFIG[matchingPattern] : { maxAge: 0, varyByQuery: false, varyByAuth: false }
}

/**
 * Get a cached response if available
 */
export function getCachedResponse(cacheKey: string): NextResponse | null {
  const entry = responseCache.get(cacheKey)

  if (!entry) return null

  const now = Date.now()
  const age = now - entry.timestamp

  // If the entry is expired, remove it and return null
  if (age > entry.expiry) {
    responseCache.delete(cacheKey)
    return null
  }

  // Clone the response and add cache status header
  const response = entry.response.clone()
  response.headers.set("X-Cache", "HIT")
  response.headers.set("X-Cache-Age", age.toString())

  return response
}

/**
 * Cache an API response
 */
export function cacheResponse(cacheKey: string, response: NextResponse, maxAge: number): NextResponse {
  // Don't cache error responses
  if (!response.ok) return response

  // Clone the response before caching
  const clonedResponse = response.clone()

  // Add cache headers to the original response
  response.headers.set("Cache-Control", `max-age=${Math.floor(maxAge / 1000)}, private`)
  response.headers.set("X-Cache", "MISS")

  // Store in the cache
  responseCache.set(cacheKey, {
    response: clonedResponse,
    timestamp: Date.now(),
    expiry: maxAge,
  })

  return response
}

/**
 * Clear cache entries for a specific user
 */
export function clearUserCache(userId: string): void {
  for (const [key, _] of responseCache.entries()) {
    if (key.includes(`|user:${userId}`)) {
      responseCache.delete(key)
    }
  }
}

/**
 * Clear all cache entries matching a path pattern
 */
export function clearCacheByPattern(pattern: string): void {
  for (const [key, _] of responseCache.entries()) {
    if (key.startsWith(pattern)) {
      responseCache.delete(key)
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = {
    size: responseCache.size,
    entries: {} as Record<string, { age: number; expiry: number }>,
    byRoute: {} as Record<string, number>,
  }

  const now = Date.now()

  for (const [key, entry] of responseCache.entries()) {
    const route = key.split("?")[0].split("|")[0]
    const age = now - entry.timestamp

    stats.entries[key] = {
      age,
      expiry: entry.expiry,
    }

    stats.byRoute[route] = (stats.byRoute[route] || 0) + 1
  }

  return stats
}

/**
 * Middleware function to handle API response caching
 */
export async function withApiCache(
  request: Request,
  handler: () => Promise<NextResponse>,
  userId?: string | null,
): Promise<NextResponse> {
  const url = new URL(request.url)
  const path = url.pathname
  const config = getRouteConfig(path)

  // Skip caching for non-GET requests or routes without caching
  if (request.method !== "GET" || config.maxAge === 0) {
    return handler()
  }

  // Generate cache key
  const cacheKey = generateCacheKey(path, url.searchParams, userId)

  // Try to get from cache
  const cachedResponse = getCachedResponse(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }

  // Execute the handler
  const response = await handler()

  // Cache the response
  return cacheResponse(cacheKey, response, config.maxAge)
}
