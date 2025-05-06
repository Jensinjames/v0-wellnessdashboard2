"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import { UserService } from "@/services/user-service"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (
    email: string,
    password: string,
    userData?: { name?: string },
  ) => Promise<{
    success: boolean
    error: AuthError | Error | null
    message: string
  }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    success: boolean
    error: AuthError | Error | null
    message: string
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    success: boolean
    error: AuthError | Error | null
    message: string
  }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

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
        }
      } catch (err) {
        console.error("Error initializing auth:", err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, userData?: { name?: string }) => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()

      // Ensure user_profiles table exists
      await UserService.createUserProfilesTable()

      // 1. Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error("User creation failed")
      }

      // 2. Create the user profile in our database
      const userProfile = await UserService.createUserProfile({
        auth_id: data.user.id,
        email: data.user.email!,
        display_name: userData?.name || email.split("@")[0],
      })

      if (!userProfile) {
        throw new Error("Database error saving new user")
      }

      return {
        success: true,
        error: null,
        message: "Account created successfully! Please check your email for verification instructions.",
      }
    } catch (error) {
      console.error("Sign up error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create account"

      return {
        success: false,
        error: error as AuthError | Error,
        message: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Check if we need to create a profile for this user
      if (data.user) {
        const profile = await UserService.getUserProfileByAuthId(data.user.id)

        if (!profile) {
          // Create profile if it doesn't exist
          await UserService.createUserProfile({
            auth_id: data.user.id,
            email: data.user.email!,
            display_name: data.user.email!.split("@")[0],
          })
        }
      }

      return {
        success: true,
        error: null,
        message: "Signed in successfully!",
      }
    } catch (error) {
      console.error("Sign in error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in"

      return {
        success: false,
        error: error as AuthError | Error,
        message: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        error: null,
        message: "Password reset instructions sent to your email.",
      }
    } catch (error) {
      console.error("Reset password error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password"

      return {
        success: false,
        error: error as AuthError | Error,
        message: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
