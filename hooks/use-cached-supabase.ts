"use client"

import { useState, useEffect } from "react"
import { getCachedSupabaseClient } from "@/lib/cached-supabase-client"

type CachedSupabaseConfig = Parameters<typeof getCachedSupabaseClient>[0]

/**
 * Custom hook for using the cached Supabase client
 * @param config Configuration options
 * @returns Cached Supabase client and stats
 */
export function useCachedSupabase(config?: CachedSupabaseConfig) {
  const [client] = useState(() => getCachedSupabaseClient(config))
  const [stats, setStats] = useState(() => client.getCacheStats())

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(client.getCacheStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [client])

  return {
    client,
    stats,
    supabase: client.getRawClient(),
    select: client.select.bind(client),
    insert: client.insert.bind(client),
    update: client.update.bind(client),
    delete: client.delete.bind(client),
    clearCache: client.clearCache.bind(client),
    invalidateCache: client.invalidateCache.bind(client),
  }
}
