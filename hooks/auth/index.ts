"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient, User, Session } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Singleton pattern for Supabase client to prevent multiple instances
let supabaseClient: SupabaseClient<Database> | null = null

/**
 * Creates a singleton Supabase client for use in client components
 * This ensures we don't create multiple instances of the client
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) return supabaseClient

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Check your .env.local file.")
  }

  // Create the client
  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return supabaseClient
}

/**
 * Get the current user synchronously (returns null if not available yet)
 * This is useful for components that need to check if a user is logged in
 * without waiting for the async operation to complete
 */
export function getCurrentUserSync(): User | null {
  try {
    const supabase = getSupabaseClient()
    // Access the internal state of the auth store
    // This is a synchronous operation
    return supabase.auth.getUser().data?.user || null
  } catch (error) {
    console.error("Error getting current user synchronously:", error)
    return null
  }
}

/**
 * Get the current user asynchronously
 * This is the recommended way to get the current user
 * as it will always return the most up-to-date user data
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error.message)
      return null
    }

    return data.user
  } catch (error) {
    console.error("Unexpected error getting current user:", error)
    return null
  }
}

/**
 * Get the current session asynchronously
 * This is useful for components that need to access the session token
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting current session:", error.message)
      return null
    }

    return data.session
  } catch (error) {
    console.error("Unexpected error getting current session:", error)
    return null
  }
}

/**
 * Middleware function to handle authentication state changes
 * This can be used to perform actions when auth state changes
 */
export function authStateChangeMiddleware(
  callback: (event: "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED" | "TOKEN_REFRESHED", session: any) => void,
) {
  const supabase = getSupabaseClient()

  return supabase.auth.onAuthStateChange((event, session) => {
    // Call the provided callback with the event and session
    callback(event, session)

    // Additional middleware logic can be added here
    // For example, logging, analytics, or state updates
    console.log(`Auth state changed: ${event}`)

    // You can also access environment variables here if needed
    if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
      console.log("Auth state change in development mode")
    }
  })
}

/**
 * Helper function to get environment-specific configuration
 */
export function getAuthConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
    appEnv: process.env.NEXT_PUBLIC_APP_ENV || "development",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
  }
}

// Auth state hook
export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
}

export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to refresh the auth state
  const refresh = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()

      // Get the current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error getting session:", sessionError.message)
        setSession(null)
        setUser(null)
        return
      }

      setSession(sessionData.session)

      // If we have a session, get the user data
      if (sessionData.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error("Error getting user:", userError.message)
          setUser(null)
          return
        }

        setUser(userData.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Unexpected error refreshing auth state:", error)
      setSession(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial auth state fetch
    refresh()

    // Set up a listener for auth state changes
    const supabase = getSupabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)

      // If we have a session, get the user data
      if (session) {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error("Error getting user after auth state change:", error.message)
          setUser(null)
        } else {
          setUser(data.user)
        }
      } else {
        setUser(null)
      }

      setIsLoading(false)
    })

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    refresh,
  }
}

// Sign in hook
export interface SignInCredentials {
  email: string
  password: string
}

export interface SignInResult {
  error: Error | null
  data: {
    user: User | null
    session: Session | null
  }
}

export function useSignIn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const signIn = async (credentials: SignInCredentials): Promise<SignInResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword(credentials)

      if (error) {
        setError(error)
        return { error, data: { user: null, session: null } }
      }

      return { error: null, data }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      return { error, data: { user: null, session: null } }
    } finally {
      setLoading(false)
    }
  }

  return { signIn, loading, error }
}

// Sign up hook
export interface SignUpCredentials {
  email: string
  password: string
  name?: string
  metadata?: Record<string, any>
}

export interface SignUpResult {
  error: Error | null
  data: {
    user: User | null
    session: Session | null
  }
  emailConfirmationSent?: boolean
}

export function useSignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const signUp = async (credentials: SignUpCredentials): Promise<SignUpResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()

      // Prepare metadata
      const metadata = {
        name: credentials.name || "",
        ...credentials.metadata,
      }

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        setError(error)
        return { error, data: { user: null, session: null } }
      }

      // Check if email confirmation is required
      const emailConfirmationSent = data.user?.identities?.length === 0 || data.user?.confirmed_at === null

      return {
        error: null,
        data,
        emailConfirmationSent,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      return { error, data: { user: null, session: null } }
    } finally {
      setLoading(false)
    }
  }

  return { signUp, loading, error }
}

// Sign out hook
export interface SignOutResult {
  error: Error | null
}

export function useSignOut() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const signOut = async (): Promise<SignOutResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error)
        return { error }
      }

      return { error: null }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  return { signOut, loading, error }
}

// Password reset hook
export interface PasswordResetCredentials {
  email: string
}

export interface PasswordResetResult {
  success: boolean
  error: Error | null
}

export function usePasswordReset() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const requestReset = async (email: string): Promise<PasswordResetResult> => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate email
      if (!email || !email.includes("@")) {
        const validationError = new Error("Please enter a valid email address")
        setError(validationError)
        return { success: false, error: validationError }
      }

      console.log("Requesting password reset for:", email)

      const supabase = getSupabaseClient()

      // Log Supabase client info for debugging
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log("Redirect URL:", `${window.location.origin}/auth/reset-password/confirm`)

      // Call the resetPasswordForEmail method with proper error handling
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      console.log("Reset password response:", { data, error })

      if (error) {
        console.error("Supabase reset password error:", error)
        setError(error)
        return { success: false, error }
      }

      // Even if there's no error, check if data exists
      if (!data) {
        const noDataError = new Error("No response from server. Please try again.")
        setError(noDataError)
        return { success: false, error: noDataError }
      }

      setSuccess(true)
      return { success: true, error: null }
    } catch (err) {
      console.error("Unexpected error in password reset:", err)
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword: string): Promise<PasswordResetResult> => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate password
      if (!newPassword || newPassword.length < 6) {
        const validationError = new Error("Password must be at least 6 characters")
        setError(validationError)
        return { success: false, error: validationError }
      }

      console.log("Updating password")

      const supabase = getSupabaseClient()

      // Call the updateUser method with proper error handling
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      console.log("Update password response:", { data, error })

      if (error) {
        console.error("Supabase update password error:", error)
        setError(error)
        return { success: false, error }
      }

      setSuccess(true)
      return { success: true, error: null }
    } catch (err) {
      console.error("Unexpected error in password update:", err)
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  return { requestReset, updatePassword, loading, success, error }
}
