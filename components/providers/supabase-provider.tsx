"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient, resetSupabaseClient } from "@/lib/supabase-client-core"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseProvider")

// Session context type
type SupabaseContextType = {
  session: Session | null
  user: User | null
  isLoading: boolean
  refresh: () => Promise<void>
}

// Create the context
const SupabaseContext = createContext<SupabaseContextType>({
  session: null,
  user: null,
  isLoading: true,
  refresh: async () => {},
})

// Provider component
export function SupabaseProvider({
  children,
  initialSession,
}: { children: ReactNode; initialSession?: Session | null }) {
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [isLoading, setIsLoading] = useState(!initialSession)

  // Function to manually refresh the session
  const refresh = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      setSession(data.session)
      setUser(data.session?.user || null)
    } catch (error) {
      logger.error("Error refreshing session:", error)
      // If we get an auth error, reset the client to force re-initialization
      resetSupabaseClient()
    } finally {
      setIsLoading(false)
    }
  }

  // Listen for auth changes
  useEffect(() => {
    const supabase = getSupabaseClient()

    // If we don't have an initial session, fetch it
    if (!initialSession) {
      refresh()
    }

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      logger.debug(`Auth state changed: ${event}`)
      setSession(newSession)
      setUser(newSession?.user || null)
    })

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [initialSession])

  return <SupabaseContext.Provider value={{ session, user, isLoading, refresh }}>{children}</SupabaseContext.Provider>
}

// Custom hook to use the Supabase context
export const useSupabaseAuth = () => useContext(SupabaseContext)
