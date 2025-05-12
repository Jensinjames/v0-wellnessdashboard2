"use client"

import { useState, useEffect } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient, authStateChangeMiddleware } from "."

/**
 * Hook to manage authentication state
 * Provides current user, session, loading state, and authentication status
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Get the Supabase client
    const supabase = getSupabaseClient()

    // Get the initial session
    const getInitialSession = async () => {
      try {
        setLoading(true)
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          setSession(data.session)
          setUser(data.session.user)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Error getting session:", error)
      } finally {
        setLoading(false)
      }
    }

    // Call the function to get the initial session
    getInitialSession()

    // Set up the auth state change listener using our middleware
    const {
      data: { subscription },
    } = authStateChangeMiddleware((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsAuthenticated(!!session)
      setLoading(false)
    })

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, session, loading, isAuthenticated }
}
