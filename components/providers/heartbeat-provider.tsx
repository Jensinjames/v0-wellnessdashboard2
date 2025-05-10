"use client"

import type React from "react"

import { useEffect } from "react"
import { startDatabaseHeartbeat, stopDatabaseHeartbeat } from "@/utils/db-heartbeat"

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start the database heartbeat when the component mounts
    startDatabaseHeartbeat()

    // Clean up the heartbeat when the component unmounts
    return () => {
      stopDatabaseHeartbeat()
    }
  }, [])

  return <>{children}</>
}
