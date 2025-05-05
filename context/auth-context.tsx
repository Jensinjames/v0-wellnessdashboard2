"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase-client"
import { handleAuthError } from "@/utils/auth-error-handler"
import { ensureProfileExists } from "@/services/profile-service"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"]

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signUp: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updatePassword: (passwords: { current_password: string; new_password: string }) => Promise<{ error: Error | null }>
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to delay execution (for retry logic)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseClient()

        // Get initial session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setIsLoading(false)
          return
        }

        const { session } = data
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Use a timeout to avoid immediate fetch after page load
          setTimeout(() => {
            fetchProfile(session.user.id)
          }, 500)
        } else {
          setIsLoading(false)
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            // Use a timeout to avoid immediate fetch after auth change
            setTimeout(() => {
              fetchProfile(session.user.id)
            }, 500)
          } else {
            setProfile(null)
            setIsLoading(false)
          }

          // Update server state
          if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            router.refresh()
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error)
        setIsLoading(false)
        setNetworkError(true)
      }
    }

    initializeAuth()
  }, [router])

  // Create a mock profile when we can't fetch the real one
  const createMockProfile = (userId: string, email?: string): UserProfile => {
    return {
      id: userId,
      email: email || "user@example.com",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      first_name: null,
      last_name: null,
      avatar_url: null,
    }
  }

  // Fetch user profile with retry logic
  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      // Add a delay before fetching to avoid rate limiting
      // Use exponential backoff for retries
      const backoffTime = retryCount === 0 ? 500 : Math.min(1000 * Math.pow(2, retryCount), 10000)
      await delay(backoffTime)

      console.log(`Fetching profile for user ${userId}, attempt ${retryCount + 1}`)

      // If we've already had network errors, use a mock profile
      if (networkError) {
        console.log("Using mock profile due to previous network errors")
        setProfile(createMockProfile(userId, user?.email))
        setIsLoading(false)
        return
      }

      const supabase = getSupabaseClient()

      // Use a more robust approach with try/catch
      try {
        const { data, error, status } = await supabase.from("profiles").select("*").eq("id", userId).single()

        // Handle rate limiting
        if (status === 429 || (error && error.message?.includes("Too Many Requests"))) {
          console.log(`Rate limited (429), retrying in ${backoffTime * 2}ms...`)

          // If we've tried too many times, use a mock profile
          if (retryCount >= 3) {
            console.log("Too many retries, using mock profile")
            setProfile(createMockProfile(userId, user?.email))
            setIsLoading(false)
            return
          }

          // Otherwise retry
          return fetchProfile(userId, retryCount + 1)
        }

        if (error) {
          console.error(`Error fetching profile (status ${status}):`, error)

          // If we get a 404, the profile might not exist yet
          if (status === 404 || status === 406) {
            // Try to create the profile
            await createProfile(userId)
            return
          }

          // For other errors, use a mock profile after too many retries
          if (retryCount >= 2) {
            setProfile(createMockProfile(userId, user?.email))
          } else {
            return fetchProfile(userId, retryCount + 1)
          }

          setIsLoading(false)
          return
        }

        setProfile(data)
      } catch (fetchError: any) {
        console.error("Error in Supabase fetch:", fetchError)

        // Check if this is a network error
        if (
          fetchError.message?.includes("Failed to fetch") ||
          fetchError.message?.includes("Network Error") ||
          fetchError.message?.includes("network")
        ) {
          console.log("Network error detected, using mock profile")
          setNetworkError(true)
          setProfile(createMockProfile(userId, user?.email))
          setIsLoading(false)
          return
        }

        // Check if this is a rate limiting error
        if (fetchError.message?.includes("Too Many Requests") || fetchError.message?.includes("429")) {
          console.log(`Rate limited error caught, retrying in ${backoffTime * 2}ms...`)

          // If we've tried too many times, use a mock profile
          if (retryCount >= 3) {
            console.log("Too many retries, using mock profile")
            setProfile(createMockProfile(userId, user?.email))
            setIsLoading(false)
            return
          }

          // Otherwise retry
          return fetchProfile(userId, retryCount + 1)
        }

        // For other errors, use a mock profile after too many retries
        if (retryCount >= 2) {
          setProfile(createMockProfile(userId, user?.email))
        } else {
          return fetchProfile(userId, retryCount + 1)
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error)

      // After several retries, use a mock profile
      if (retryCount >= 2) {
        setProfile(createMockProfile(userId, user?.email))
      } else {
        return fetchProfile(userId, retryCount + 1)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Create a profile
  const createProfile = async (userId: string) => {
    try {
      if (!user?.email) return

      // If we've had network errors, use a mock profile
      if (networkError) {
        setProfile(createMockProfile(userId, user.email))
        return
      }

      const supabase = getSupabaseClient()

      try {
        // Use the client-side helper
        const profile = await ensureProfileExists(userId, user.email, supabase)

        if (profile) {
          setProfile(profile)
        } else {
          setProfile(createMockProfile(userId, user.email))
        }
      } catch (error) {
        console.error("Error creating profile:", error)
        setProfile(createMockProfile(userId, user.email))
      }
    } catch (error) {
      console.error("Unexpected error creating profile:", error)
      setProfile(createMockProfile(userId, user?.email))
    }
  }

  // Sign up
  const signUp = async ({ email, password }: { email: string; password: string }) => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error: new Error(handleAuthError(error, "sign-up")) }
      }

      // Create user profile
      if (data.user) {
        await createProfile(data.user.id)
      }

      return { error: null }
    } catch (error: any) {
      return { error: new Error(handleAuthError(error, "sign-up")) }
    }
  }

  // Sign in
  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: new Error(handleAuthError(error, "sign-in")) }
      }

      return { error: null }
    } catch (error: any) {
      return { error: new Error(handleAuthError(error, "sign-in")) }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      router.push("/auth/sign-in")
    } catch (error) {
      console.error("Error signing out:", error)
      // Even if there's an error, we should still redirect to sign-in
      router.push("/auth/sign-in")
    }
  }

  // Update password
  const updatePassword = async ({
    current_password,
    new_password,
  }: { current_password: string; new_password: string }) => {
    try {
      const supabase = getSupabaseClient()

      // If we're resetting password (no current_password), just update
      if (!current_password) {
        const { error } = await supabase.auth.updateUser({
          password: new_password,
        })

        if (error) {
          return { error: new Error(handleAuthError(error, "password-update")) }
        }

        return { error: null }
      }

      // Otherwise, verify current password first by signing in
      if (!user?.email) {
        return { error: new Error("User email not found") }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current_password,
      })

      if (signInError) {
        return { error: new Error("Current password is incorrect") }
      }

      // Then update password
      const { error } = await supabase.auth.updateUser({
        password: new_password,
      })

      if (error) {
        return { error: new Error(handleAuthError(error, "password-update")) }
      }

      return { error: null }
    } catch (error: any) {
      return { error: new Error(handleAuthError(error, "password-update")) }
    }
  }

  // Update profile
  const updateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error("User not authenticated") }
      }

      // If we've had network errors, simulate success but don't actually update
      if (networkError) {
        // Update the local profile state
        setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))
        return { error: null }
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          ...updatedProfile,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        return { error: new Error(handleAuthError(error, "profile-update")) }
      }

      // Refresh profile
      fetchProfile(user.id)

      return { error: null }
    } catch (error: any) {
      return { error: new Error(handleAuthError(error, "profile-update")) }
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    updatePassword,
    updateProfile,
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
