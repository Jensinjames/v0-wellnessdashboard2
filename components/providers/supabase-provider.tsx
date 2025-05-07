"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { CLIENT_ENV } from "@/lib/env-config"

// Create a context for the Supabase client
type SupabaseContext = {
  supabase: SupabaseClient<Database>
}

const SupabaseContext = createContext<SupabaseContext | undefined>(undefined)

// Provider component that wraps your app and makes Supabase client available
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Validate environment variables
  if (!CLIENT_ENV.SUPABASE_URL || !CLIENT_ENV.SUPABASE_ANON_KEY) {
    console.error("Missing required Supabase environment variables")
    // Render an error message or fallback UI
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h2 className="text-lg font-semibold">Configuration Error</h2>
        <p>Missing required Supabase environment variables. Please check your configuration.</p>
      </div>
    )
  }

  // Create a Supabase client for use in the browser
  const supabaseClient = useRef<SupabaseClient<Database> | null>(null)
  const [supabase] = useState(() => {
    supabaseClient.current = createClientComponentClient<Database>()
    return supabaseClient.current
  })

  useEffect(() => {
    // Optional: Set up any listeners or initialization logic here
    const setupClient = async () => {
      try {
        // Test the connection
        const { error } = await supabase.auth.getSession()
        if (error) {
          console.error("Error initializing Supabase client:", error.message)
        }
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err)
      }
    }

    setupClient()
  }, [supabase])

  return <SupabaseContext.Provider value={{ supabase }}>{children}</SupabaseContext.Provider>
}

// Hook to use the Supabase client
export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context.supabase
}
