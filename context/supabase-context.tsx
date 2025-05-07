"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isInitialized: boolean
  isOnline: boolean
  query: <T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<T>,
    options?: { requiresAuth?: boolean },
  ) => Promise<T>
  refreshToken: () => Promise<boolean>
  getTokenStatus: () => any
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      try {
        const client = createClientComponentClient<Database>()
        setSupabase(client)
        setIsInitialized(true)
      } catch (error) {
        console.error("Error initializing Supabase client:", error)
      }
    }

    initialize()
  }, [])

  const query = useCallback(
    async <T>(\
      queryFn: (client: SupabaseClient<Database>) => Promise<T>,
      options: { requiresAuth?: boolean } = {},
    ): Promise<T> => {
  if (!supabase) {
    throw new Error("Supabase client not initialized")
  }

  try {
    return await queryFn(supabase)
  } catch (error) {
    console.error("Query error:", error)
    throw error
  }
}
,
    [supabase],
  )

const refreshToken = useCallback(async () => {
  // Placeholder for token refresh logic
  return true
}, [])

const getTokenStatus = useCallback(() => {
  return {
    valid: true,
    expiresAt: Date.now() + 3600,
  }
}, [])

const value = {
  supabase,
  isInitialized,
  isOnline,
  query,
  refreshToken,
  getTokenStatus,
}

return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
