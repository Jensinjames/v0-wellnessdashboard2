"use client"

/**
 * Hook to use the Supabase singleton
 */

import { useState, useEffect } from "react"
import { getSupabaseSingleton, resetSupabaseSingleton } from "@/lib/supabase-singleton"
import { createLogger } from "@/utils/logger"

// Track the number of instances created
let instanceCount = 0

// Export the instance count
export { instanceCount }

// Create a dedicated logger for the hook
const logger = createLogger("useSupabaseSingleton")

/**
 * Hook to use the Supabase singleton
 * This hook ensures we only have one Supabase client instance across the application
 */
export function useSupabaseSingleton() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      // Get the Supabase singleton instance
      const supabase = getSupabaseSingleton()
      setIsInitialized(true)

      // Increment the instance count
      instanceCount++

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        logger.info(`Auth state changed: ${event}`)
      })

      // Clean up the subscription when the component unmounts
      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      logger.error("Error initializing Supabase singleton:", error)
      setIsInitialized(false)
    }
  }, [])

  return {
    supabase: getSupabaseSingleton(),
    isInitialized,
    reset: resetSupabaseSingleton,
  }
}

export default useSupabaseSingleton
