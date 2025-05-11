"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import { getSupabaseClient, resetSupabaseClient } from "@/lib/supabase-client"
import { createLogger } from "@/utils/logger"

// Create a logger for auth context
const logger = createLogger("AuthContext")

// Types
export type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; data?: { session: Session | null } }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>
  getClientInfo: () => any
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to check if an error is a database grant error
function isDatabaseGrantError(error: any): boolean {
  if (!error || !error.message) return false

  const errorMessage = error.message.toLowerCase()
  return (
    errorMessage.includes("database error granting") ||
    errorMessage.includes("granting user undefined") ||
    errorMessage.includes("permission denied") ||
    errorMessage.includes("database permission error")
  )
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Refresh session and profile data
  const refreshProfile = useCallback(async () => {
    try {
      const supabase = getSupabaseClient()
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        logger.error("Error getting session:", error)
        throw error
      }

      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
      } else {
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      logger.error("Error refreshing profile:", error)
      setSession(null)
      setUser(null)
    }
  }, [])

  // Handle auth state changes
  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      logger.info(`Auth state changed: ${event}`)

      if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)

        // Reset the Supabase client to ensure clean state
        resetSupabaseClient()

        // Redirect to sign-in page on sign out
        if (!pathname?.startsWith("/auth/")) {
          router.push("/auth/sign-in")
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session) {
          setSession(session)
          setUser(session.user)
        }

        // Refresh profile data when signed in or token refreshed
        await refreshProfile()
      }
    },
    [pathname, refreshProfile, router],
  )

  // Set up auth state listener
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseClient()

        // Get initial session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          logger.error("Error getting initial session:", error)
          if (isMounted) setIsLoading(false)
          return
        }

        if (isMounted) {
          setSession(data.session)
          setUser(data.session?.user ?? null)
        }

        // Set up auth listener
        const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (isMounted) {
            await handleAuthStateChange(event, session)
          }
        })

        if (isMounted) setIsLoading(false)

        return () => {
          authData.subscription.unsubscribe()
        }
      } catch (error) {
        logger.error("Error initializing auth:", error)
        if (isMounted) setIsLoading(false)
      }
    }

    const cleanup = initializeAuth()

    return () => {
      isMounted = false
      // Cleanup auth listener
      cleanup.then((unsubscribe) => {
        if (unsubscribe) unsubscribe()
      })
    }
  }, [handleAuthStateChange])

  // Function to fix database permissions
  const fixDatabasePermissions = useCallback(async (): Promise<boolean> => {
    try {
      logger.info("Attempting to fix database permissions")

      const response = await fetch("/api/auth/fix-database-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        logger.error("Failed to fix database permissions:", data)
        return false
      }

      logger.info("Successfully fixed database permissions")
      return true
    } catch (error) {
      logger.error("Error fixing database permissions:", error)
      return false
    }
  }, [])

  // Auth methods
  const signIn = useCallback(
    async (email: string, password: string) => {
      logger.info("Signing in user", { email: email.substring(0, 3) + "..." })

      try {
        // Reset the client before sign-in to ensure clean state
        resetSupabaseClient()

        const supabase = getSupabaseClient()
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (result.error) {
          // Check for database grant errors
          if (isDatabaseGrantError(result.error)) {
            logger.error("Database grant error during sign-in:", result.error)

            // Try to fix database permissions
            const fixed = await fixDatabasePermissions()

            if (fixed) {
              logger.info("Fixed database permissions, retrying sign-in")

              // Reset the client and try again
              resetSupabaseClient()

              // Try signing in again
              const retryResult = await supabase.auth.signInWithPassword({
                email,
                password,
              })

              if (!retryResult.error) {
                return retryResult
              }

              // If we still have an error, return it with a more user-friendly message
              if (isDatabaseGrantError(retryResult.error)) {
                return {
                  error: {
                    ...retryResult.error,
                    message: "Database permission error persists. Please try again later or contact support.",
                  } as AuthError,
                  data: retryResult.data,
                }
              }

              return retryResult
            }

            // Return a more user-friendly error
            return {
              error: {
                ...result.error,
                message: "A database permission error occurred. Please try again or contact support.",
              } as AuthError,
              data: result.data,
            }
          }

          logger.error("Sign-in error:", result.error)
        }

        return result
      } catch (error) {
        logger.error("Unexpected error during sign-in:", error)
        return { error: error as AuthError }
      }
    },
    [fixDatabasePermissions],
  )

  const signUp = useCallback(async (email: string, password: string) => {
    logger.info("Signing up user", { email: email.substring(0, 3) + "..." })

    try {
      const supabase = getSupabaseClient()
      return await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (error) {
      logger.error("Error signing up:", error)
      return { error: error as AuthError }
    }
  }, [])

  const signOut = useCallback(async () => {
    logger.info("Signing out user")

    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()

      // Reset the client after sign-out
      resetSupabaseClient()
    } catch (error) {
      logger.error("Error signing out:", error)

      // Even if there's an error, reset state and client
      setUser(null)
      setSession(null)
      resetSupabaseClient()
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    logger.info("Resetting password", { email: email.substring(0, 3) + "..." })

    try {
      const supabase = getSupabaseClient()

      // Get the current origin for the redirect URL
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const redirectTo = `${origin}/auth/reset-password`

      // Call the resetPasswordForEmail method with the correct parameters
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      return result
    } catch (error) {
      logger.error("Error resetting password:", error)
      return { error: error as AuthError }
    }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    logger.info("Updating password")

    try {
      const supabase = getSupabaseClient()
      return await supabase.auth.updateUser({ password })
    } catch (error) {
      logger.error("Error updating password:", error)
      return { error: error as AuthError }
    }
  }, [])

  // Get client info for internal use
  const getClientInfo = useCallback(() => {
    const supabase = getSupabaseClient()
    return {
      hasClient: !!supabase,
      isInitializing: isLoading,
    }
  }, [isLoading])

  // Create context value
  const contextValue = useMemo(
    () => ({
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      getClientInfo,
    }),
    [user, session, isLoading, signIn, signUp, signOut, resetPassword, updatePassword, refreshProfile, getClientInfo],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
