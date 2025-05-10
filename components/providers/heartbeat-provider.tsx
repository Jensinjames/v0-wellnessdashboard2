"use client"

import type React from "react"

import { useEffect } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { startDatabaseHeartbeat, stopDatabaseHeartbeat } from "@/utils/db-heartbeat"
import { createLogger } from "@/utils/logger"

const logger = createLogger("HeartbeatProvider")

interface HeartbeatProviderProps {
  children: React.ReactNode
}

export function HeartbeatProvider({ children }: HeartbeatProviderProps) {
  const { supabase } = useSupabase()

  useEffect(() => {
    // Only start the heartbeat if we have a supabase client
    if (!supabase) {
      logger.warn("No Supabase client available, not starting heartbeat")
      return
    }

    // Start the database heartbeat when the component mounts
    logger.info("Starting database heartbeat")
    const cleanup = startDatabaseHeartbeat(supabase)

    // Stop the heartbeat when the component unmounts
    return () => {
      logger.info("Stopping database heartbeat")
      cleanup()
      stopDatabaseHeartbeat()
    }
  }, [supabase])

  return <>{children}</>
}
