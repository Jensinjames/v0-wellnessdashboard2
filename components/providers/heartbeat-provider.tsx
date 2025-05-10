/**
 * Heartbeat Provider Component
 *
 * This component provides a heartbeat mechanism to keep database connections alive
 * and prevent connection pool timeouts.
 */
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { startDatabaseHeartbeat, stopDatabaseHeartbeat } from "@/utils/db-heartbeat"

interface HeartbeatProviderProps {
  children: React.ReactNode
  interval?: number // Heartbeat interval in milliseconds
}

export function HeartbeatProvider({ children, interval }: HeartbeatProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (isInitialized) return

    // Start the heartbeat
    startDatabaseHeartbeat(interval)
    setIsInitialized(true)

    // Clean up on unmount
    return () => {
      stopDatabaseHeartbeat()
    }
  }, [interval, isInitialized])

  return <>{children}</>
}
