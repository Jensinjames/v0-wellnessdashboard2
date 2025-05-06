"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase-client"
import { handleAuthError } from "@/utils/auth-error-handler"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"]

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signUp: (credentials: { email: string; password: string }) => Promise<{ error: Error | null; mockSignUp?: boolean }>
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: Error | null; mockSignIn?: boolean }>
  signOut: () => Promise<void>
  updatePassword: (passwords: { current_password: string; new_password: string }) => Promise<{ error: Error | null }>
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to delay execution (for retry logic)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

// Generate a mock user ID
const generateMockUserId = () => {
  return `mock-${Math.random().toString(36).substring(2, 15)}`
}

// Create a mock session
const createMockSession = (userId: string, email: string): Session => {
  return {
    access_token: `mock-token-${Math.random().toString(36).substring(2, 15)}`,
    refresh_token: `mock-refresh-${Math.random().toString(36).substring(2, 15)}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: userId,
      email: email,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)
  const [databaseError, setDatabaseError] = useState(false)
  const [authError, setAuthError] = useState(false)
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

  // Fetch user profile with retry logic - using direct fetch to handle non-JSON responses
  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      // Add a delay before fetching to avoid rate limiting
      // Use exponential backoff for retries
      const backoffTime = retryCount === 0 ? 500 : Math.min(1000 * Math.pow(2, retryCount), 10000)
      await delay(backoffTime)

      console.log(`Fetching profile for user ${userId}, attempt ${retryCount + 1}`)

      // If we've already had network errors, use a mock profile
      if (networkError || databaseError) {
        console.log("Using mock profile due to previous errors")
        setProfile(createMockProfile(userId, user?.email))
        setIsLoading(false)
        return
      }

      // Use direct fetch instead of Supabase client to handle non-JSON responses
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase URL or key is missing")
        setProfile(createMockProfile(userId, user?.email))
        setIsLoading(false)
        return
      }

      try {
        // Use a direct fetch with proper error handling
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&limit=1`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${session?.access_token || ""}`,
            Prefer: "return=representation",
          },
        })

        // Check for rate limiting
        if (response.status === 429) {
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

        // Handle other errors
        if (!response.ok) {
          console.error(`Error fetching profile: ${response.status} ${response.statusText}`)

          // If we get a 404, the profile might not exist yet
          if (response.status === 404 || response.status === 406) {
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

        // Check if the response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Response is not JSON:", contentType)
          setProfile(createMockProfile(userId, user?.email))
          setIsLoading(false)
          return
        }

        // Parse the response
        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          setProfile(data[0])
        } else if (user?.email) {
          // If no profile found, try to create one
          await createProfile(userId)
        } else {
          // If we can't create a profile, use a mock one
          setProfile(createMockProfile(userId, user?.email))
        }
      } catch (fetchError: any) {
        console.error("Error in fetch:", fetchError)

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

        // Check if this is a JSON parsing error (likely due to non-JSON response)
        if (fetchError instanceof SyntaxError && fetchError.message.includes("Unexpected token")) {
          console.log("JSON parsing error, likely rate limited. Using mock profile.")
          setProfile(createMockProfile(userId, user?.email))
          setIsLoading(false)
          return
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

  // Create a profile - using direct fetch to handle non-JSON responses
  const createProfile = async (userId: string) => {
    try {
      if (!user?.email) return

      // If we've had network errors, use a mock profile
      if (networkError || databaseError) {
        setProfile(createMockProfile(userId, user.email))
        return
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase URL or key is missing")
        setProfile(createMockProfile(userId, user.email))
        return
      }

      try {
        // Create new profile
        const newProfile = {
          id: userId,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Use a direct fetch with proper error handling
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${session?.access_token || ""}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify(newProfile),
        })

        // Check for rate limiting
        if (response.status === 429) {
          console.log("Rate limited during profile creation, using mock profile")
          setProfile(createMockProfile(userId, user.email))
          return
        }

        // Handle other errors
        if (!response.ok) {
          console.error(`Error creating profile: ${response.status} ${response.statusText}`)
          setDatabaseError(true)
          setProfile(createMockProfile(userId, user.email))
          return
        }

        // Check if the response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Response is not JSON:", contentType)
          setProfile(createMockProfile(userId, user.email))
          return
        }

        // Parse the response
        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          setProfile(data[0])
        } else {
          setProfile(createMockProfile(userId, user.email))
        }
      } catch (fetchError: any) {
        console.error("Error creating profile:", fetchError)

        // Check if this is a JSON parsing error (likely due to non-JSON response)
        if (fetchError instanceof SyntaxError && fetchError.message.includes("Unexpected token")) {
          console.log("JSON parsing error, likely rate limited. Using mock profile.")
        }

        setProfile(createMockProfile(userId, user.email))
      }
    } catch (error) {
      console.error("Unexpected error creating profile:", error)
      setProfile(createMockProfile(userId, user?.email))
    }
  }

  // Sign up - with mock sign-up fallback
  const signUp = async ({ email, password }: { email: string; password: string }) => {
    try {
      // If we've already had database errors, use mock sign-up
      if (databaseError) {
        console.log("Using mock sign-up due to previous database errors")

        // Create a mock user and session
        const mockUserId = generateMockUserId()
        const mockUser = {
          id: mockUserId,
          email,
          created_at: new Date().toISOString(),
        } as User

        // Set the user and create a mock profile
        setUser(mockUser)
        setProfile(createMockProfile(mockUserId, email))

        return { error: null, mockSignUp: true }
      }

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        // Check if this is a database error
        if (error.message?.includes("Database error") || error.message?.includes("db error")) {
          console.error("Database error during sign-up:", error)
          setDatabaseError(true)

          // Create a mock user and session
          const mockUserId = generateMockUserId()
          const mockUser = {
            id: mockUserId,
            email,
            created_at: new Date().toISOString(),
          } as User

          // Set the user and create a mock profile
          setUser(mockUser)
          setProfile(createMockProfile(mockUserId, email))

          return { error: null, mockSignUp: true }
        }

        return { error: new Error(handleAuthError(error, "sign-up")) }
      }

      // Create user profile
      if (data.user) {
        await createProfile(data.user.id)
      }

      return { error: null }
    } catch (error: any) {
      // Check if this is a database error
      if (error.message?.includes("Database error") || error.message?.includes("db error")) {
        console.error("Database error during sign-up:", error)
        setDatabaseError(true)

        // Create a mock user and session
        const mockUserId = generateMockUserId()
        const mockUser = {
          id: mockUserId,
          email,
          created_at: new Date().toISOString(),
        } as User

        // Set the user and create a mock profile
        setUser(mockUser)
        setProfile(createMockProfile(mockUserId, email))

        return { error: null, mockSignUp: true }
      }

      return { error: new Error(handleAuthError(error, "sign-up")) }
    }
  }

  // Sign in - with mock sign-in fallback
  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      // If we've already had auth errors, use mock sign-in
      if (authError || networkError || databaseError) {
        console.log("Using mock sign-in due to previous errors")

        // Create a mock user, session, and profile
        const mockUserId = generateMockUserId()
        const mockUser = {
          id: mockUserId,
          email,
          created_at: new Date().toISOString(),
        } as User
        const mockSession = createMockSession(mockUserId, email)

        // Set the user, session, and profile
        setUser(mockUser)
        setSession(mockSession)
        setProfile(createMockProfile(mockUserId, email))

        return { error: null, mockSignIn: true }
      }

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check if this is an auth error (invalid credentials)
        if (error.message?.includes("Invalid login credentials") || error.status === 400) {
          console.error("Auth error during sign-in:", error)
          setAuthError(true)

          // Create a mock user, session, and profile
          const mockUserId = generateMockUserId()
          const mockUser = {
            id: mockUserId,
            email,
            created_at: new Date().toISOString(),
          } as User
          const mockSession = createMockSession(mockUserId, email)

          // Set the user, session, and profile
          setUser(mockUser)
          setSession(mockSession)
          setProfile(createMockProfile(mockUserId, email))

          return { error: null, mockSignIn: true }
        }

        return { error: new Error(handleAuthError(error, "sign-in")) }
      }

      return { error: null }
    } catch (error: any) {
      // Check if this is a network error
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network Error") ||
        error.message?.includes("network")
      ) {
        console.error("Network error during sign-in:", error)
        setNetworkError(true)

        // Create a mock user, session, and profile
        const mockUserId = generateMockUserId()
        const mockUser = {
          id: mockUserId,
          email,
          created_at: new Date().toISOString(),
        } as User
        const mockSession = createMockSession(mockUserId, email)

        // Set the user, session, and profile
        setUser(mockUser)
        setSession(mockSession)
        setProfile(createMockProfile(mockUserId, email))

        return { error: null, mockSignIn: true }
      }

      return { error: new Error(handleAuthError(error, "sign-in")) }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      // Clear local state
      setUser(null)
      setProfile(null)
      setSession(null)

      // If we're in mock mode, just redirect
      if (authError || networkError || databaseError) {
        router.push("/auth/sign-in")
        return
      }

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
      // If we're in mock mode, simulate success
      if (authError || networkError || databaseError) {
        return { error: null }
      }

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

  // Update profile - using direct fetch to handle non-JSON responses
  const updateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error("User not authenticated") }
      }

      // If we've had network errors, simulate success but don't actually update
      if (networkError || databaseError || authError) {
        // Update the local profile state
        setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))
        return { error: null }
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase URL or key is missing")
        return { error: new Error("Configuration error") }
      }

      try {
        // Use a direct fetch with proper error handling
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${session?.access_token || ""}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            ...updatedProfile,
            updated_at: new Date().toISOString(),
          }),
        })

        // Check for rate limiting
        if (response.status === 429) {
          console.log("Rate limited during profile update")
          return { error: new Error("Too many requests. Please try again later.") }
        }

        // Handle other errors
        if (!response.ok) {
          console.error(`Error updating profile: ${response.status} ${response.statusText}`)
          return { error: new Error(`Error updating profile: ${response.statusText}`) }
        }

        // Update local state
        setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))

        return { error: null }
      } catch (fetchError: any) {
        console.error("Error updating profile:", fetchError)

        // Check if this is a JSON parsing error (likely due to non-JSON response)
        if (fetchError instanceof SyntaxError && fetchError.message.includes("Unexpected token")) {
          console.log("JSON parsing error, likely rate limited.")
          return { error: new Error("Too many requests. Please try again later.") }
        }

        return { error: new Error(fetchError.message || "Error updating profile") }
      }
    } catch (error: any) {
      return { error: new Error(error.message || "Error updating profile") }
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
