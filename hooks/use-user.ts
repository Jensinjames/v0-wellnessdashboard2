"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      // Get session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      // If no session, that's okay - just set user to null
      if (!sessionData.session) {
        setUser(null)
        return
      }

      // If we have a session, get the user
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      setUser(userData.user)
    } catch (error) {
      console.error("Error fetching user:", error)
      // Don't set error state for missing session - this is a normal condition
      if (error instanceof Error && !error.message.includes("Auth session missing")) {
        setError(error instanceof Error ? error.message : "Unknown error")
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    setIsLoading(true)
    await fetchUser()
    return { success: true }
  }, [fetchUser])

  useEffect(() => {
    fetchUser()

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [fetchUser])

  return { user, isLoading, error, refreshUser }
}
