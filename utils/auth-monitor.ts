/**
 * Auth Monitor Utility
 * Monitors and reports on GoTrueClient instances and authentication state
 */
"use client"

import { getInstanceCount } from "@/lib/supabase-manager"

// Debug mode
const DEBUG = process.env.NEXT_PUBLIC_DEBUG_MODE === "true"

// Monitoring interval in milliseconds
const MONITOR_INTERVAL = 60000 // 1 minute

// Store for monitoring data
interface MonitoringData {
  instanceCount: number
  lastChecked: number
  memoryUsage?: number
}

let monitoringData: MonitoringData = {
  instanceCount: 0,
  lastChecked: 0,
}

// Start monitoring
let monitorInterval: NodeJS.Timeout | null = null

/**
 * Start monitoring GoTrueClient instances
 */
export function startAuthMonitoring(): () => void {
  if (monitorInterval) {
    return () => stopAuthMonitoring()
  }

  if (DEBUG) {
    console.log("[AuthMonitor] Starting auth monitoring")
  }

  // Initial check
  checkInstances()

  // Set up interval
  monitorInterval = setInterval(checkInstances, MONITOR_INTERVAL)

  // Return cleanup function
  return () => stopAuthMonitoring()
}

/**
 * Stop monitoring GoTrueClient instances
 */
export function stopAuthMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null

    if (DEBUG) {
      console.log("[AuthMonitor] Stopped auth monitoring")
    }
  }
}

/**
 * Check for GoTrueClient instances
 */
function checkInstances(): void {
  try {
    // Get instance count from Supabase manager
    const instanceCount = getInstanceCount()

    // Update monitoring data
    monitoringData = {
      instanceCount,
      lastChecked: Date.now(),
      memoryUsage: getMemoryUsage(),
    }

    if (DEBUG) {
      console.log("[AuthMonitor] Instance count:", instanceCount)
    }

    // Log warning if there are multiple instances
    if (instanceCount > 1 && DEBUG) {
      console.warn(
        `[AuthMonitor] Multiple GoTrueClient instances detected (${instanceCount}). This may cause authentication issues.`,
      )
    }
  } catch (error) {
    console.error("[AuthMonitor] Error checking instances:", error)
  }
}

/**
 * Get memory usage if available
 */
function getMemoryUsage(): number | undefined {
  if (typeof performance !== "undefined" && performance.memory) {
    // @ts-ignore - memory is not in the standard TypeScript types
    return performance.memory.usedJSHeapSize
  }
  return undefined
}

/**
 * Get monitoring data
 */
export function getMonitoringData(): MonitoringData {
  return { ...monitoringData }
}

/**
 * Check if monitoring is active
 */
export function isMonitoringActive(): boolean {
  return monitorInterval !== null
}
