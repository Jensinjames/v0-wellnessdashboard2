import type { FullProfile } from "@/types/profile"

// Simple in-memory cache
const profileCache = new Map<string, { profile: FullProfile; timestamp: number }>()

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000

// Get profile from cache
export function getCachedProfile(userId: string): FullProfile | null {
  const cached = profileCache.get(userId)

  // If not in cache or expired, return null
  if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION_MS) {
    if (cached) {
      // Remove expired cache entry
      profileCache.delete(userId)
    }
    return null
  }

  return cached.profile
}

// Set profile in cache
export function setCachedProfile(userId: string, profile: FullProfile): void {
  profileCache.set(userId, {
    profile,
    timestamp: Date.now(),
  })
}

// Clear profile from cache
export function clearCachedProfile(userId: string): void {
  profileCache.delete(userId)
}

// Clear all profiles from cache
export function clearAllCachedProfiles(): void {
  profileCache.clear()
}

// Get cache stats
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: profileCache.size,
    entries: Array.from(profileCache.keys()),
  }
}
