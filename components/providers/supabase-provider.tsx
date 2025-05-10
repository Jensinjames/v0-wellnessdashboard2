"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase-client-fixed"
import type { Database } from "@/types/database"

// Define the shape of our Supabase context
interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isLoading: boolean
  error: Error | null
}

// Create the context with default values
const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isLoading: true,
  error: null,
})

// Hook to use the Supabase context
export const useSupabaseContext = () => useContext(SupabaseContext)

interface SupabaseProviderProps {
  children: React.ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function initializeSupabase() {
      try {
        setIsLoading(true)
        const client = await getSupabaseClient()
        setSupabase(client as SupabaseClient<Database>)
        setError(null)
      } catch (err) {
        console.error("Error initializing Supabase client:", err)
        setError(err instanceof Error ? err : new Error("Failed to initialize Supabase client"))
      } finally {
        setIsLoading(false)
      }
    }

    initializeSupabase()
  }, [])

  return <SupabaseContext.Provider value={{ supabase, isLoading, error }}>{children}</SupabaseContext.Provider>
}
