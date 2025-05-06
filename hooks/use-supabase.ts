"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Create a singleton hook instance
let supabaseInstance: SupabaseClient<Database> | null = null

export function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)

  useEffect(() => {
    // Only create a new instance if one doesn't exist
    if (!supabaseInstance) {
      supabaseInstance = getSupabaseClient()
    }

    setSupabase(supabaseInstance)

    // No cleanup needed as we're using a singleton
  }, [])

  return supabase || getSupabaseClient()
}
