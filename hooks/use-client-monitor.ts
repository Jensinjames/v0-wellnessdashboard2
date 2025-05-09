"use client"

/**
 * Hook to monitor GoTrueClient instances
 * This is useful for debugging and ensuring only one instance exists
 */

import { useState, useEffect, useCallback } from "react"
import { getClientStats, cleanupOrphanedClients } from "@/lib/supabase-singleton-manager"

export function useClientMonitor(
  options: {
    monitorInterval?: number
    autoCleanup?: boolean
  } = {},
) {
  const {
    monitorInterval = 10000, // 10 seconds
    autoCleanup = true,
  } = options

  const [stats, setStats] = useState(getClientStats())
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null)

  // Function to refresh stats
  const refreshStats = useCallback(() => {
    setStats(getClientStats())
  }, [])

  // Function to force cleanup
  const forceCleanup = useCallback(() => {
    cleanupOrphanedClients(true)
    setLastCleanup(new Date())
    refreshStats()
  }, [refreshStats])

  // Set up monitoring interval
  useEffect(() => {
    // Initial check
    refreshStats()

    // Set up interval for monitoring
    const intervalId = setInterval(() => {
      const currentStats = getClientStats()
      setStats(currentStats)

      // Auto-cleanup if needed
      if (autoCleanup && currentStats.goTrueClientCount > 1) {
        cleanupOrphanedClients(true)
        setLastCleanup(new Date())
      }
    }, monitorInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [monitorInterval, autoCleanup, refreshStats])

  return {
    stats,
    refreshStats,
    forceCleanup,
    lastCleanup,
    hasMultipleInstances: stats.goTrueClientCount > 1,
  }
}
