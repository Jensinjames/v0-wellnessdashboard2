"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "./use-supabase"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import type { User, Session } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: Error | null
}

interface SignUpCredentials {
  email: string
  password: string
  metadata?: Record<string, any>
  redirectTo?: string
}

interface SignInCredentials {
  email: string
  password: string
}

/**
 * Hook for Supabase authentication operations
 */
export function useSupabaseAuth() {
  const supabase = useSupabase()
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }))

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        setState({
          user: data.session?.user ?? null,
          session: data.session,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        console.error("Error getting initial session:", error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }))
      }
    }

    getInitialSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
        isLoading: false,
      }))

      // Refresh the page to update server components
      router.refresh()
    })

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  /**
   * Sign up a new user
   */
  const signUp = async (credentials: SignUpCredentials) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: credentials.metadata,
          emailRedirectTo: credentials.redirectTo,
        },
      })

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        })
        return { error, data: null }
      }

      toast({
        title: "Sign up successful",
        description: "Please check your email to verify your account.",
      })

      return { data, error: null }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      })

      return { data: null, error }
    }
  }

  /**
   * Sign in an existing user
   */
  const signIn = async (credentials: SignInCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        })
        return { error, data: null }
      }

      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      })

      return { data, error: null }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      })

      return { data: null, error }
    }
  }

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Sign out successful",
        description: "You have been signed out.",
      })

      return { error: null }
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      })

      return { error }
    }
  }

  /**
   * Reset a user's password
   */
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password.",
      })

      return { error: null }
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      })

      return { error }
    }
  }

  /**
   * Update a user's password
   */
  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      })

      return { error: null }
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      })

      return { error }
    }
  }

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }
}
