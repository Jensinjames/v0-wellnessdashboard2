"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase-client"

export function useEnhancedAuth() {
  const { user, session, isLoading, isAuthenticated } = useAuth()
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(false)
  const router = useRouter()

  // Function to validate the session on the server
  const validateSession = useCallback(async () => {
    if (!session) {
      setIsSessionValid(false)
      return false
    }

    setIsCheckingSession(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        setIsSessionValid(false)
        return false
      }

      setIsSessionValid(true)
      return true
    } catch (error) {
      console.error("Error validating session:", error)
      setIsSessionValid(false)
      return false
    } finally {
      setIsCheckingSession(false)
    }
  }, [session])

  // Validate the session when it changes
  useEffect(() => {
    if (!isLoading) {
      validateSession()
    }
  }, [isLoading, validateSession])

  // Function to redirect to login if not authenticated
  const requireAuth = useCallback(
    (redirectTo = "/auth/login") => {
      if (!isLoading && !isCheckingSession) {
        if (!isAuthenticated || isSessionValid === false) {
          router.push(redirectTo)
          return false
        }
        return true
      }
      return null // Still loading
    },
    [isLoading, isCheckingSession, isAuthenticated, isSessionValid, router],
  )

  // Function to redirect to dashboard if already authenticated
  const requireGuest = useCallback(
    (redirectTo = "/profile") => {
      if (!isLoading && !isCheckingSession) {
        if (isAuthenticated && isSessionValid) {
          router.push(redirectTo)
          return false
        }
        return true
      }
      return null // Still loading
    },
    [isLoading, isCheckingSession, isAuthenticated, isSessionValid, router],
  )

  // Function to get user claims
  const getUserClaims = useCallback(async () => {
    if (!session) return null

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        return null
      }

      return data.user.app_metadata
    } catch (error) {
      console.error("Error getting user claims:", error)
      return null
    }
  }, [session])

  return {
    user,
    session,
    isLoading: isLoading || isCheckingSession,
    isAuthenticated: isAuthenticated && isSessionValid === true,
    isSessionValid,
    requireAuth,
    requireGuest,
    validateSession,
    getUserClaims,
  }
}
