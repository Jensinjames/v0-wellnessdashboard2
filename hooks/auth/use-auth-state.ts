"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import type { User, Session, AuthError } from "@supabase/supabase-js"

export type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  isAuthenticated: boolean
  isEmailVerified: boolean
  refreshSession: () => Promise<void>
}

/**
 * Hook to track authentication state including email verification status
 * @returns Current authentication state
 */
export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  // Function to refresh the session data
  const refreshSession = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (sessionData.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        setSession(sessionData.session)
        setUser(userData.user)
      } else {
        setSession(null)
        setUser(null)
      }
    } catch (err) {
      console.error("Error refreshing session:", err)
      setError(err as AuthError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Skip on server
    if (typeof window === "undefined") {
      setLoading(false)
      return
    }

    const supabase = createClient()
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true)

        // Get current session
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        // If we have a session, get the user
        if (currentSession) {
          const {
            data: { user: currentUser },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError) {
            throw userError
          }

          if (mounted) {
            setSession(currentSession)
            setUser(currentUser)
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as AuthError)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (mounted) {
        setSession(currentSession)

        if (currentSession) {
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser()
          setUser(currentUser)
        } else {
          setUser(null)
        }

        setLoading(false)
      }
    })

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Check if email is verified
  const isEmailVerified = !!user?.email_confirmed_at || !!user?.confirmed_at

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user && !!session,
    isEmailVerified,
    refreshSession,
  }
}
