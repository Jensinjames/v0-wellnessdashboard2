"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import type { User, Session } from "@supabase/supabase-js"

export type AuthState = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
}

export function useAuthState() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  useEffect(() => {
    // Only run this effect in the browser
    if (typeof window === "undefined") {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    const supabase = createClient()
    let isMounted = true

    // Get the initial session
    const initializeAuth = async () => {
      try {
        // Get the session from Supabase
        const { data, error } = await supabase.auth.getSession()

        if (!isMounted) return

        if (error) {
          console.error("Error getting session:", error.message)
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: new Error(error.message),
          }))
          return
        }

        if (data?.session) {
          // Get the user data
          const { data: userData, error: userError } = await supabase.auth.getUser()

          if (userError || !userData?.user) {
            console.error("Error getting user data:", userError?.message || "No user data")
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: new Error(userError?.message || "Failed to get user data"),
            }))
            return
          }

          setState({
            user: userData.user,
            session: data.session,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          })
        } else {
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          })
        }
      } catch (err) {
        console.error("Error initializing auth:", err)
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err : new Error("Unknown error initializing auth"),
          }))
        }
      }
    }

    initializeAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return

      if (newSession) {
        // Get the user data
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData?.user) {
          console.error("Error getting user data:", userError?.message || "No user data")
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: new Error(userError?.message || "Failed to get user data"),
          }))
          return
        }

        setState({
          user: userData.user,
          session: newSession,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        })
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        })
      }
    })

    // Cleanup subscription
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
