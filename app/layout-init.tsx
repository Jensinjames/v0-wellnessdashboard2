"use client"

import { useEffect } from "react"
import { initializeSupabaseEarly } from "@/lib/init-supabase"

/**
 * Client Initializer Component
 *
 * This component initializes client-side functionality early in the app lifecycle.
 */
export function ClientInitializer() {
  useEffect(() => {
    // Initialize Supabase early
    initializeSupabaseEarly()
  }, [])

  return null
}
