"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; message?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; message?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Try to get the session from localStorage first
    try {
      const storedSession = localStorage.getItem("supabase.auth.session")
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession)
        if (parsedSession && parsedSession.user) {
          setSession(parsedSession)
          setUser(parsedSession.user)
        }
      }
    } catch (err) {
      console.error("Error parsing stored session:", err)
    }

    // Get the current session
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (data && data.session) {
          setSession(data.session)
          setUser(data.session.user)

          // Store session in localStorage for offline access
          localStorage.setItem("supabase.auth.session", JSON.stringify(data.session))
        }
      } catch (err) {
        console.error("Error initializing auth:", err)
        // Check if we have a stored session to use as fallback
        const storedSession = localStorage.getItem("supabase.auth.session")
        if (!storedSession) {
          setError(err instanceof Error ? err.message : "Authentication error")
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      // Store session in localStorage for offline access
      if (newSession) {
        localStorage.setItem("supabase.auth.session", JSON.stringify(newSession))
      } else {
        localStorage.removeItem("supabase.auth.session")
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { success: true }
    } catch (err) {
      console.error("Sign in error:", err)
      setError(err instanceof Error ? err.message : "Sign in failed")
      return {
        success: false,
        message: err instanceof Error ? err.message : "Sign in failed. Please check your credentials and try again.",
      }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setError(null)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) throw error

      return {
        success: true,
        message: "Please check your email for a confirmation link.",
      }
    } catch (err) {
      console.error("Sign up error:", err)
      setError(err instanceof Error ? err.message : "Sign up failed")
      return {
        success: false,
        message: err instanceof Error ? err.message : "Sign up failed. Please try again.",
      }
    }
  }

  const signOut = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()

      // Clear stored session
      localStorage.removeItem("supabase.auth.session")
    } catch (err) {
      console.error("Sign out error:", err)
      setError(err instanceof Error ? err.message : "Sign out failed")
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      return {
        success: true,
        message: "Password reset instructions sent to your email.",
      }
    } catch (err) {
      console.error("Password reset error:", err)
      setError(err instanceof Error ? err.message : "Password reset failed")
      return {
        success: false,
        message: err instanceof Error ? err.message : "Password reset failed. Please try again.",
      }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      setError(null)
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      return {
        success: true,
        message: "Password updated successfully.",
      }
    } catch (err) {
      console.error("Update password error:", err)
      setError(err instanceof Error ? err.message : "Password update failed")
      return {
        success: false,
        message: err instanceof Error ? err.message : "Password update failed. Please try again.",
      }
    }
  }

  const value = {
    user,
    session,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
