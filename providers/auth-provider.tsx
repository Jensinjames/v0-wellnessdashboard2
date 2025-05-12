"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import type { User, Session } from "@supabase/supabase-js"
import { clientEnv } from "@/lib/env"

// Helper for conditional logging
const logDebug = (message: string, data?: any) => {
  if (clientEnv.IS_DEVELOPMENT) {
    if (data) {
      console.log(`[Auth] ${message}`, data)
    } else {
      console.log(`[Auth] ${message}`)
    }
  }
}

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Only run this effect in the browser
    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    // Get the Supabase client (singleton)
    const supabase = createClient()

    // Flag to prevent state updates after unmount
    let isMounted = true

    // Function to get the initial session
    const initializeAuth = async () => {
      try {
        logDebug("Initializing auth state...")

        // Get the session from Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (sessionError) {
          logDebug(`No active session found: ${sessionError.message}`)
          setUser(null)
          setSession(null)
        } else if (session) {
          logDebug(`Session found for user: ${session.user.email}`)

          // Get the user data
          const {
            data: { user: userData },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError || !userData) {
            logDebug(`Error getting user data: ${userError?.message || "No user data"}`)
            setUser(null)
            setSession(null)
          } else {
            setSession(session)
            setUser(userData)
            logDebug("User data retrieved", userData)
          }
        } else {
          logDebug("No session found")
          setUser(null)
          setSession(null)
        }
      } catch (error) {
        console.error("[Auth] Error initializing auth:", error)
        if (isMounted) {
          setUser(null)
          setSession(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Initialize auth
    initializeAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return

      logDebug(`Auth state change: ${event}`)

      if (newSession) {
        // Get the user data
        const {
          data: { user: userData },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !userData) {
          logDebug(`Error getting user data: ${userError?.message || "No user data"}`)
          setUser(null)
          setSession(null)
        } else {
          setSession(newSession)
          setUser(userData)
          logDebug("User authenticated", {
            id: userData.id,
            email: userData.email,
          })
        }
      } else {
        setSession(null)
        setUser(null)
        logDebug("User signed out or session expired")
      }

      setIsLoading(false)

      // Handle auth events
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.refresh()
      }
    })

    // Cleanup subscription and prevent state updates after unmount
    return () => {
      logDebug("Cleaning up auth subscriptions")
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // Compute authentication status
  const isAuthenticated = !!user && !!session

  return <AuthContext.Provider value={{ user, session, isLoading, isAuthenticated }}>{children}</AuthContext.Provider>
}
