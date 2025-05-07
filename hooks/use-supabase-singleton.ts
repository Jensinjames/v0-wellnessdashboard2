"use client"

import { useState, useEffect } from "react"
import { createSupabaseSingleton, startGoTrueMonitoring } from "@/lib/supabase-singleton"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { isDebugMode } from "@/utils/environment"

/**
 * Hook to use the Supabase singleton client
 * This ensures only one client instance is used across the application
 */
export function useSupabaseSingleton() {
  // Create the client immediately to ensure it's available on first render
  const [supabase] = useState<SupabaseClient<Database>>(() => createSupabaseSingleton())

  useEffect(() => {
    // Start monitoring for multiple GoTrueClient instances
    const stopMonitoring = startGoTrueMonitoring()

    // Log debug information if in debug mode
    if (isDebugMode()) {
      console.log("[useSupabaseSingleton] Initialized Supabase client")
    }

    return () => {
      // Stop monitoring when component unmounts
      stopMonitoring()
    }
  }, [])

  return supabase
}
