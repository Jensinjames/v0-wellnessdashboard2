"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { startDatabaseHeartbeat } from "@/utils/db-heartbeat"

interface HeartbeatProviderProps {
  children: ReactNode
}

export function HeartbeatProvider({ children }: HeartbeatProviderProps) {
  const heartbeatCleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    try {
      // Get the Supabase client
      const supabase = getSupabaseClient()

      // Start the database heartbeat
      heartbeatCleanup.current = startDatabaseHeartbeat(supabase)
    } catch (error) {
      console.error("Failed to initialize heartbeat:", error)
    }

    // Cleanup function
    return () => {
      if (heartbeatCleanup.current) {
        heartbeatCleanup.current()
        heartbeatCleanup.current = null
      }
    }
  }, [])

  return <>{children}</>
}
