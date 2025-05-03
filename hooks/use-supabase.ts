"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, refreshSession } from "@/lib/supabase"
import { handleAuthError, handleSessionError } from "@/lib/auth-error-handler"
import type { Session } from "@supabase/supabase-js"

// Time before session expiry when we should attempt to refresh (5 minutes)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to check if session needs refresh
  const checkSessionRefresh = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) return

    try {
      // Calculate time until expiry
      const expiresAt = new Date(currentSession.expires_at * 1000)
      const timeUntilExpiry = expiresAt.getTime() - Date.now()

      // If session is close to expiry, refresh it
      if (timeUntilExpiry < REFRESH_THRESHOLD_MS) {
        console.log("Session nearing expiry, refreshing...")
        const { success, session: newSession, error } = await refreshSession()

        if (success && newSession) {
          setSession(newSession)
        } else if (error) {
          throw error
        }
      }
    } catch (err) {
      const errorDetails = await handleAuthError(err)
      setError(errorDetails.message)
      await handleSessionError(errorDetails)
    }
  }, [])

  // Function to get the initial session
  const getInitialSession = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      setSession(data.session)

      // Check if session needs refresh
      if (data.session) {
        await checkSessionRefresh(data.session)
      }
    } catch (err) {
      const errorDetails = await handleAuthError(err)
      setError(errorDetails.message)
      // Don't redirect on initial load if session is missing
      if (errorDetails.type !== "SESSION_MISSING") {
        await handleSessionError(errorDetails)
      }
    } finally {
      setLoading(false)
    }
  }, [checkSessionRefresh])

  useEffect(() => {
    getInitialSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setLoading(false)

      // Check if new session needs refresh
      if (session) {
        await checkSessionRefresh(session)
      }
    })

    // Set up periodic session refresh check (every 2 minutes)
    const refreshInterval = setInterval(
      () => {
        if (session) {
          checkSessionRefresh(session)
        }
      },
      2 * 60 * 1000,
    )

    // Cleanup subscription and interval on unmount
    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [getInitialSession, checkSessionRefresh, session])

  // Function to manually refresh the session
  const manualRefresh = async () => {
    try {
      setLoading(true)
      const { success, session: newSession, error } = await refreshSession()

      if (error) {
        throw error
      }

      if (success && newSession) {
        setSession(newSession)
        return { success: true }
      }

      return { success: false, error: "Failed to refresh session" }
    } catch (err) {
      const errorDetails = await handleAuthError(err)
      setError(errorDetails.message)
      await handleSessionError(errorDetails)
      return { success: false, error: errorDetails.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    session,
    loading,
    error,
    refreshSession: manualRefresh,
  }
}
