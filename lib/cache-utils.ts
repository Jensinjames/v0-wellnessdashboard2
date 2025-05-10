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

// Cache keys
export const CACHE_KEYS = {
  PROFILE: (userId: string) => `profile:${userId}`,
  CATEGORIES: (userId: string) => `categories:${userId}`,
  GOALS: (userId: string) => `goals:${userId}`,
  ENTRIES: (userId: string, timeframe?: string) => `entries:${userId}:${timeframe || "all"}`,
  DASHBOARD_DATA: (userId: string) => `dashboard:${userId}`,
}

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

/**
 * Set an item in the cache
 */
export function setCacheItem<T>(key: string, data: T, expiryTime: number): void {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiryTime,
    }
    localStorage.setItem(key, JSON.stringify(cacheItem))
    console.log(`Cache set: ${key}`)
  } catch (error) {
    console.error("Error setting cache item:", error)
    // If localStorage is full, clear older items
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldCache()
      try {
        // Try again after clearing
        const cacheItem: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          expiry: expiryTime,
        }
        localStorage.setItem(key, JSON.stringify(cacheItem))
      } catch (retryError) {
        console.error("Error setting cache item after clearing old cache:", retryError)
      }
    }
  }
}

/**
 * Get an item from the cache
 * Returns null if the item doesn't exist or has expired
 */
export function getCacheItem<T>(key: string): T | null {
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

/**
 * Remove an item from the cache
 */
export function removeCacheItem(key: string): void {
  try {
    localStorage.removeItem(key)
    console.log(`Cache removed: ${key}`)
  } catch (error) {
    console.error("Error removing cache item:", error)
  }
}

/**
 * Clear all cache items for a specific user
 */
export function clearUserCache(userId: string): void {
  try {
    // Get all keys in localStorage
    const keys = Object.keys(localStorage)

    // Filter keys that belong to this user
    const userKeys = keys.filter((key) => key.includes(`:${userId}`) || key.includes(`:${userId}:`))

    // Remove all user-specific keys
    userKeys.forEach((key) => localStorage.removeItem(key))
    console.log(`Cleared cache for user: ${userId}`)
  } catch (error) {
    console.error("Error clearing user cache:", error)
  }
}

/**
 * Clear old cache items to free up space
 */
export function clearOldCache(): void {
  try {
    const keys = Object.keys(localStorage)
    const now = Date.now()

    // Check each item and remove if expired
    keys.forEach((key) => {
      const item = localStorage.getItem(key)
      if (item) {
        try {
          const cacheItem = JSON.parse(item) as CacheItem<unknown>
          if (now - cacheItem.timestamp > cacheItem.expiry) {
            localStorage.removeItem(key)
          }
        } catch (e) {
          // If the item isn't a valid cache item, skip it
        }
      }
    })

    console.log("Cleared old cache items")
  } catch (error) {
    console.error("Error clearing old cache:", error)
  }
}

/**
 * Check if the browser supports localStorage
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = "test"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Get the total size of the cache in bytes
 */
export function getCacheSize(): number {
  try {
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ""
        totalSize += key.length + value.length
      }
    }
    return totalSize
  } catch (error) {
    console.error("Error calculating cache size:", error)
    return 0
  }
}
