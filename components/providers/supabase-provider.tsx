"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { getSupabaseClient, monitorGoTrueClientInstances, resetSupabaseClient } from "@/lib/supabase-client"
import { startDatabaseHeartbeat } from "@/utils/db-heartbeat"
import { createLogger } from "@/utils/logger"
import { CLIENT_ENV } from "@/lib/env-config"

const logger = createLogger("SupabaseProvider")

// Create a context for the Supabase client
type SupabaseContext = {
  initialized: boolean
  error: Error | null
}

const SupabaseContext = createContext<SupabaseContext>({
  initialized: false,
  error: null,
})

// Provider component that wraps your app and makes Supabase client available
export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const heartbeatCleanup = useRef<(() => void) | null>(null)
  const monitorCleanup = useRef<{ start: () => void; stop: () => void } | null>(null)

  useEffect(() => {
    // Initialize Supabase client
    try {
      // Get the client (this will initialize it if it doesn't exist)
      const supabase = getSupabaseClient()

      // Start the database heartbeat
      heartbeatCleanup.current = startDatabaseHeartbeat(supabase)

      // Start monitoring GoTrue instances if in debug mode
      if (CLIENT_ENV.DEBUG_MODE) {
        monitorCleanup.current = monitorGoTrueClientInstances()
        monitorCleanup.current.start()
      }

      // Mark as initialized
      setInitialized(true)

      logger.info("Supabase provider initialized successfully")
    } catch (err) {
      logger.error("Error initializing Supabase provider:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    }

    // Cleanup function
    return () => {
      // Stop the database heartbeat
      if (heartbeatCleanup.current) {
        heartbeatCleanup.current()
        heartbeatCleanup.current = null
      }

      // Stop monitoring GoTrue instances
      if (monitorCleanup.current) {
        monitorCleanup.current.stop()
        monitorCleanup.current = null
      }

      // Reset the client on unmount to prevent memory leaks
      resetSupabaseClient()

      logger.info("Supabase provider cleaned up")
    }
  }, [])

  // If there's an error, show an error message
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h2 className="text-lg font-semibold">Supabase Configuration Error</h2>
        <p>{error.message}</p>
        <p className="mt-2 text-sm">Please check your environment variables and make sure they are correctly set.</p>
      </div>
    )
  }

  return <SupabaseContext.Provider value={{ initialized, error }}>{children}</SupabaseContext.Provider>
}

// Hook to check if Supabase is initialized
export function useSupabaseStatus() {
  return useContext(SupabaseContext)
}
