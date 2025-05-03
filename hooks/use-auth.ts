"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Provider } from "@supabase/supabase-js"
import type { AuthState } from "@/types/supabase"

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  })

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        setAuthState({
          user: session?.user || null,
          session,
          isLoading: false,
          error: null,
        })

        // Set up auth state change listener
        const {
          data: { subscription },
        } = await supabase.auth.onAuthStateChange((_event, session) => {
          setAuthState({
            user: session?.user || null,
            session,
            isLoading: false,
            error: null,
          })
        })

        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error("Failed to initialize auth"),
        })
      }
    }

    initializeAuth()
  }, [])

  // Sign up with email and password
  const signUp = useCallback(
    async (email: string, password: string, options?: { redirectTo?: string; metadata?: Record<string, any> }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: options?.redirectTo,
            data: options?.metadata,
          },
        })

        if (error) {
          throw error
        }

        toast({
          title: "Sign up successful",
          description: "Please check your email for verification instructions.",
        })

        return { success: true, data }
      } catch (error) {
        console.error("Sign up error:", error)

        toast({
          title: "Sign up failed",
          description: error instanceof Error ? error.message : "Failed to sign up",
          variant: "destructive",
        })

        setAuthState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error("Failed to sign up"),
        }))

        return { success: false, error }
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [],
  )

  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string, options?: { redirectTo?: string }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw error
        }

        toast({
          title: "Sign in successful",
          description: "Welcome back!",
        })

        if (options?.redirectTo) {
          router.push(options.redirectTo)
        }

        return { success: true, data }
      } catch (error) {
        console.error("Sign in error:", error)

        toast({
          title: "Sign in failed",
          description: error instanceof Error ? error.message : "Failed to sign in",
          variant: "destructive",
        })

        setAuthState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error("Failed to sign in"),
        }))

        return { success: false, error }
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [router],
  )

  // Sign in with social provider
  const signInWithProvider = useCallback(
    async (provider: Provider, options?: { redirectTo?: string; scopes?: string }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: options?.redirectTo,
            scopes: options?.scopes,
          },
        })

        if (error) {
          throw error
        }

        return { success: true, data }
      } catch (error) {
        console.error("Social sign in error:", error)

        toast({
          title: "Social sign in failed",
          description: error instanceof Error ? error.message : "Failed to sign in",
          variant: "destructive",
        })

        setAuthState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error("Failed to sign in with social provider"),
        }))

        return { success: false, error }
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [],
  )

  // Sign out
  const signOut = useCallback(
    async (options?: { redirectTo?: string }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

        const { error } = await supabase.auth.signOut()

        if (error) {
          throw error
        }

        toast({
          title: "Sign out successful",
          description: "You have been signed out.",
        })

        if (options?.redirectTo) {
          router.push(options.redirectTo)
        }

        return { success: true }
      } catch (error) {
        console.error("Sign out error:", error)

        toast({
          title: "Sign out failed",
          description: error instanceof Error ? error.message : "Failed to sign out",
          variant: "destructive",
        })

        setAuthState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error("Failed to sign out"),
        }))

        return { success: false, error }
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [router],
  )

  // Reset password
  const resetPassword = useCallback(async (email: string, options?: { redirectTo?: string }) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: options?.redirectTo,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Password reset email sent",
        description: "Please check your email for password reset instructions.",
      })

      return { success: true, data }
    } catch (error) {
      console.error("Password reset error:", error)

      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "Failed to send password reset email",
        variant: "destructive",
      })

      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("Failed to reset password"),
      }))

      return { success: false, error }
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

      const { data, error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      })

      return { success: true, data }
    } catch (error) {
      console.error("Update password error:", error)

      toast({
        title: "Password update failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      })

      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("Failed to update password"),
      }))

      return { success: false, error }
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Update user profile
  const updateProfile = useCallback(async (updates: { email?: string; data?: Record<string, any> }) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

      const { data, error } = await supabase.auth.updateUser({
        email: updates.email,
        data: updates.data,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })

      return { success: true, data }
    } catch (error) {
      console.error("Update profile error:", error)

      toast({
        title: "Profile update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })

      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error("Failed to update profile"),
      }))

      return { success: false, error }
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  return {
    ...authState,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }
}
