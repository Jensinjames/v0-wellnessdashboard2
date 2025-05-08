"use client"

import { useState, useEffect } from "react"
import { getOptimizedSupabaseClient } from "@/lib/optimized-supabase-client"

type OptimizedSupabaseConfig = Parameters<typeof getOptimizedSupabaseClient>[0]

/**
 * Custom hook for using the optimized Supabase client
 * @param config Configuration options
 * @returns Optimized Supabase client and stats
 */
export function useOptimizedSupabase(config?: OptimizedSupabaseConfig) {
  const [client] = useState(() => getOptimizedSupabaseClient(config))
  const [stats, setStats] = useState(() => client.getStats())

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(client.getStats())
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
    applyOptimisticUpdates: client.applyOptimisticUpdates.bind(client),
    invalidateCache: client.invalidateCache.bind(client),
    clearCache: client.clearCache.bind(client),
  }
}
