"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

// Auth context type
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (
    email: string,
    password: string,
    metadata?: { [key: string]: any },
  ) => Promise<{
    error: AuthError | null
    emailConfirmationSent?: boolean
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<void>
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const { toast } = useToast()

  // Refresh the session
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error refreshing session:", error.message)
        return
      }

      if (session) {
        setSession(session)
        setUser(session.user)
      } else {
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (!error) {
        await refreshSession()
        router.refresh()
      }

      return { error }
    } catch (err) {
      console.error("Sign in error:", err)
      return { error: err as AuthError }
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (!error) {
        // Check if email confirmation is required
        const emailConfirmationSent = !data.session

        if (!emailConfirmationSent) {
          // If no email confirmation is required, user is already signed in
          await refreshSession()
          router.refresh()
        }

        return { error: null, emailConfirmationSent }
      }

      return { error }
    } catch (err) {
      console.error("Sign up error:", err)
      return { error: err as AuthError }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      setUser(null)
      setSession(null)

      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error signing out",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      return { error }
    } catch (err) {
      console.error("Reset password error:", err)
      return { error: err as AuthError }
    }
  }

  // Update password
  const updatePassword = async (password: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (!error) {
        await refreshSession()
      }

      return { error }
    } catch (err) {
      console.error("Update password error:", err)
      return { error: err as AuthError }
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      await refreshSession()
    }

    initializeAuth()
  }, [refreshSession])

  // Set up auth state change listener
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (session) {
        setSession(session)
        setUser(session.user)
      } else {
        setSession(null)
        setUser(null)
      }

      setIsLoading(false)

      // Refresh the router to update server components
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Create the context value
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
