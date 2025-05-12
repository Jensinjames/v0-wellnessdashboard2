"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === "development"

// Helper for conditional logging
const logDebug = (message: string, data?: any) => {
  if (isDevelopment) {
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
    const supabase = createBrowserClient()

    // Flag to prevent state updates after unmount
    let isMounted = true

    // Function to get the initial session
    const initializeAuth = async () => {
      try {
        logDebug("Initializing auth state...")

        // Get the session from Supabase
        const { data, error } = await supabase.auth.getSession()

        if (!isMounted) return

        if (error) {
          logDebug(`No active session found: ${error.message}`)
          setUser(null)
          setSession(null)
        } else if (data?.session) {
          logDebug(`Session found for user: ${data.session.user.email}`)
          setSession(data.session)
          setUser(data.session.user)
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
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return

      logDebug(`Auth state change: ${event}`)

      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
        logDebug("User authenticated", {
          id: newSession.user.id,
          email: newSession.user.email,
        })
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
