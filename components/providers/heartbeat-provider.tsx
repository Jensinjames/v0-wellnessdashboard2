"use client"

import type React from "react"

import { useEffect } from "react"
import { startDatabaseHeartbeat, stopDatabaseHeartbeat } from "@/utils/db-heartbeat"
import { useAuth } from "@/context/auth-context"

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    // Only start the heartbeat if the user is authenticated
    if (user) {
      startDatabaseHeartbeat()

      return () => {
        stopDatabaseHeartbeat()
      }
    }
  }, [user])

  return <>{children}</>
}
