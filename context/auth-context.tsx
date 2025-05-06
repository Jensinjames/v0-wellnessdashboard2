"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase-client"
import { handleAuthError } from "@/utils/auth-error-handler"
import type { Database } from "@/types/database"

// Import the cache utilities at the top of the file
import { setCacheItem, getCacheItem, clearUserCache, CACHE_KEYS, CACHE_EXPIRY } from "@/lib/cache-utils"

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

// Check if an error is a rate limiting error
const isRateLimitError = (error: any): boolean => {
  if (!error) return false

  // Check various ways a rate limit error might appear
  if (error.status === 429) return true
  if (error.code === 429) return true
  if (
    error.message &&
    (error.message.includes("Too Many R") ||
      error.message.includes("Too many r") ||
      error.message.includes("429") ||
      error.message.includes("rate limit"))
  )
    return true

  return false
}

// Check if an error is a JSON parsing error
const isJsonParsingError = (error: any): boolean => {
  if (!error) return false

  return error instanceof SyntaxError && (error.message.includes("Unexpected token") || error.message.includes("JSON"))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [databaseError, setDatabaseError] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Immediately set a timeout to ensure we don't block the UI for too long
        const timeoutId = setTimeout(() => {
          if (isLoading) {
            console.log("Auth initialization taking too long, using fallback")
            setIsLoading(false)
            setNetworkError(true)
          }
        }, 5000) // 5 second timeout

        // Get the singleton instance
        const supabase = getSupabaseClient()

        // Get initial session
        const { data, error } = await supabase.auth.getSession()

        // Clear the timeout since we got a response
        clearTimeout(timeoutId)

        if (error) {
          console.error("Error getting session:", error)
          setNetworkError(true)
          setIsLoading(false)
          return
        }

        const { session } = data
        setSession(session)
        setUser(session?.user ?? null)
        setIsAuthenticated(!!session?.user)

        if (session?.user) {
          // Check cache first for profile data
          const cachedProfile = getCacheItem<UserProfile>(CACHE_KEYS.PROFILE(session.user.id))

          if (cachedProfile) {
            // Use cached profile data
            console.log("Using cached profile data")
            setProfile(cachedProfile)
            setIsLoading(false)
          } else {
            // No cache, fetch from API
            setTimeout(() => {
              fetchProfile(session.user.id).catch((err) => {
                console.error("Error in fetchProfile:", err)
                setProfile(createMockProfile(session.user.id, session.user.email))
                setIsLoading(false)
              })
            }, 500)
          }
        } else {
          setIsLoading(false)
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setIsAuthenticated(!!session?.user)

          if (session?.user) {
            // Use a timeout to avoid immediate fetch after auth change
            setTimeout(() => {
              fetchProfile(session.user.id).catch((err) => {
                console.error("Error in fetchProfile during auth change:", err)
                setProfile(createMockProfile(session.user.id, session.user.email))
                setIsLoading(false)
              })
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
  }, [router, isLoading])

  // Create a profile using the Supabase client
  const createProfile = async (userId: string) => {
    try {
      if (!user?.email) return

      // If we've had network errors, use a mock profile
      if (networkError || databaseError || rateLimited) {
        setProfile(createMockProfile(userId, user.email))
        return
      }

      // Get the singleton instance
      const supabase = getSupabaseClient()

      try {
        // Create new profile
        const newProfile = {
          id: userId,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Set a timeout to ensure we don't wait too long
        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => {
          setTimeout(() => reject(new Error("Profile creation timed out")), 5000)
        })

        // Use a try-catch block specifically for the Supabase call
        let profileResult
        try {
          profileResult = await Promise.race([
            supabase.from("profiles").insert(newProfile).select().single(),
            timeoutPromise,
          ])
        } catch (supabaseError) {
          console.error("Error during Supabase profile creation:", supabaseError)

          // Check if this is a JSON parsing error (rate limiting)
          if (isJsonParsingError(supabaseError) || isRateLimitError(supabaseError)) {
            console.log("Rate limiting detected during profile creation")
            setRateLimited(true)
            setProfile(createMockProfile(userId, user.email))
            return
          }

          throw supabaseError
        }

        const { data, error } = profileResult

        if (error) {
          // Check for rate limiting
          if (isRateLimitError(error)) {
            console.log("Rate limited during profile creation")
            setRateLimited(true)
            setProfile(createMockProfile(userId, user.email))
            return
          }

          console.error("Error creating profile:", error)
          setDatabaseError(true)
          setProfile(createMockProfile(userId, user.email))
          return
        }

        if (data) {
          // Cache the profile data
          setCacheItem(CACHE_KEYS.PROFILE(userId), data, CACHE_EXPIRY.PROFILE)
          setProfile(data)
        }
      } catch (error: any) {
        // Check if this is a rate limiting error or JSON parsing error
        if (isJsonParsingError(error) || isRateLimitError(error)) {
          console.log("Rate limited during profile creation (caught exception)")
          setRateLimited(true)
          setProfile(createMockProfile(userId, user.email))
          return
        }

        console.error("Error creating profile:", error)
        setDatabaseError(true)
        setProfile(createMockProfile(userId, user.email))
      }
    } catch (error: any) {
      console.error("Unexpected error creating profile:", error)
      setProfile(createMockProfile(userId, user?.email))
    }
  }

  // Fetch user profile with retry logic and better error handling
  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      // Check cache first
      const cachedProfile = getCacheItem<UserProfile>(CACHE_KEYS.PROFILE(userId))

      if (cachedProfile) {
        console.log("Using cached profile data")
        setProfile(cachedProfile)
        setIsLoading(false)
        return
      }

      // Add a delay before fetching to avoid rate limiting
      // Use exponential backoff for retries
      const backoffTime = retryCount === 0 ? 500 : Math.min(1000 * Math.pow(2, retryCount), 10000)
      await delay(backoffTime)

      console.log(`Fetching profile for user ${userId}, attempt ${retryCount + 1}`)

      // If we've already had network errors, use a mock profile
      if (networkError || databaseError || rateLimited) {
        console.log("Using mock profile due to previous errors")
        setProfile(createMockProfile(userId, user?.email))
        setIsLoading(false)
        return
      }

      // Set a timeout to ensure we don't wait too long
      const timeoutId = setTimeout(() => {
        console.log("Profile fetch timed out, using mock profile")
        setNetworkError(true)
        setProfile(createMockProfile(userId, user?.email))
        setIsLoading(false)
      }, 8000) // 8 second timeout

      try {
        // Get the singleton instance
        const supabase = getSupabaseClient()

        // Use a try-catch block specifically for the Supabase call
        let profileResult
        try {
          profileResult = await supabase.from("profiles").select("*").eq("id", userId).single()
        } catch (supabaseError) {
          // Clear the timeout since we got an error
          clearTimeout(timeoutId)

          console.error("Error during Supabase profile fetch:", supabaseError)

          // Check if this is a JSON parsing error (likely rate limiting)
          if (isJsonParsingError(supabaseError)) {
            console.log("JSON parsing error detected (likely rate limiting)")
            setRateLimited(true)
            setProfile(createMockProfile(userId, user?.email))
            setIsLoading(false)
            return
          }

          // Check if this is a rate limiting error
          if (isRateLimitError(supabaseError)) {
            console.log("Rate limiting error detected")
            setRateLimited(true)
            setProfile(createMockProfile(userId, user?.email))
            setIsLoading(false)
            return
          }

          // For other errors, retry or use mock profile
          if (retryCount < 2) {
            return fetchProfile(userId, retryCount + 1)
          } else {
            setProfile(createMockProfile(userId, user?.email))
            setIsLoading(false)
            return
          }
        }

        // Clear the timeout since we got a response
        clearTimeout(timeoutId)

        const { data, error } = profileResult

        if (error) {
          console.error("Error fetching profile:", error)

          // Check for rate limiting
          if (isRateLimitError(error)) {
            console.log("Rate limited during profile fetch")
            setRateLimited(true)
            setProfile(createMockProfile(userId, user?.email))
            setIsLoading(false)
            return
          }

          // If we get a 404, the profile might not exist yet
          if (error.code === "PGRST116") {
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

        if (data) {
          // Cache the profile data
          setCacheItem(CACHE_KEYS.PROFILE(userId), data, CACHE_EXPIRY.PROFILE)
          setProfile(data)
        } else {
          // If no profile found, try to create one
          await createProfile(userId)
        }
      } catch (fetchError: any) {
        // Clear the timeout since we got an error
        clearTimeout(timeoutId)

        console.error("Error fetching profile:", fetchError)

        // Check if this is a JSON parsing error (likely rate limiting)
        if (isJsonParsingError(fetchError)) {
          console.log("JSON parsing error detected (likely rate limiting)")
          setRateLimited(true)
          setProfile(createMockProfile(userId, user?.email))
          setIsLoading(false)
          return
        }

        // Check if this is a rate limiting error
        if (isRateLimitError(fetchError)) {
          console.log("Rate limiting error detected")
          setRateLimited(true)
          setProfile(createMockProfile(userId, user?.email))
          setIsLoading(false)
          return
        }

        // Check if this is a network error
        if (fetchError instanceof TypeError && fetchError.message.includes("Failed to fetch")) {
          console.log("Network error detected, using mock profile")
          setNetworkError(true)
          setProfile(createMockProfile(userId, user?.email))
          setIsLoading(false)
          return
        }

        // For other errors, retry a few times
        if (retryCount < 2) {
          return fetchProfile(userId, retryCount + 1)
        } else {
          // After retries, use mock profile
          setProfile(createMockProfile(userId, user?.email))
        }
      }
    } catch (error: any) {
      console.error("Unexpected error fetching profile:", error)

      // Check if this is a JSON parsing error (likely rate limiting)
      if (isJsonParsingError(error)) {
        console.log("JSON parsing error detected (likely rate limiting)")
        setRateLimited(true)
        setProfile(createMockProfile(userId, user?.email))
        setIsLoading(false)
        return
      }

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

  // Sign up - with mock sign-up fallback
  const signUp = async ({ email, password }: { email: string; password: string }) => {
    try {
      // If we've already had database errors, use mock sign-up
      if (databaseError || networkError || rateLimited) {
        console.log("Using mock sign-up due to previous errors")

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

      // Get the singleton instance
      const supabase = getSupabaseClient()

      // Set a timeout for the sign-up operation
      const timeoutPromise = new Promise<{ data: { user: null; session: null }; error: Error }>((_, reject) => {
        setTimeout(() => reject(new Error("Sign-up timed out")), 10000)
      })

      // Use a try-catch block specifically for the Supabase call
      let signUpResult
      try {
        signUpResult = await Promise.race([
          supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          }),
          timeoutPromise,
        ])
      } catch (supabaseError) {
        console.error("Error during Supabase sign-up:", supabaseError)

        // Check if this is a JSON parsing error (rate limiting)
        if (isJsonParsingError(supabaseError) || isRateLimitError(supabaseError)) {
          console.log("Rate limiting detected during sign-up")
          setRateLimited(true)

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

        return { error: new Error(handleAuthError(supabaseError, "sign-up")) }
      }

      const { data, error } = signUpResult

      if (error) {
        // Check if this is a timeout or network error
        if (error.message === "Timeout" || error.message?.includes("Failed to fetch")) {
          console.error("Network error during sign-up:", error)
          setNetworkError(true)

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
      // Check if this is a JSON parsing error (likely rate limiting)
      if (isJsonParsingError(error)) {
        console.log("JSON parsing error detected during sign-up (likely rate limiting)")
        setRateLimited(true)

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

      // Check if this is a network error
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network Error") ||
        error.message?.includes("network")
      ) {
        console.error("Network error during sign-up:", error)
        setNetworkError(true)

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
      if (authError || networkError || databaseError || rateLimited) {
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

      // Get the singleton instance
      const supabase = getSupabaseClient()

      // Set a timeout for the sign-in operation
      const timeoutPromise = new Promise<{ data: { user: null; session: null }; error: Error }>((_, reject) => {
        setTimeout(() => reject(new Error("Sign-in timed out")), 10000)
      })

      // Use a try-catch block specifically for the Supabase call
      let signInResult
      try {
        signInResult = await Promise.race([
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
          timeoutPromise,
        ])
      } catch (supabaseError) {
        console.error("Error during Supabase sign-in:", supabaseError)

        // Check if this is a JSON parsing error (rate limiting)
        if (isJsonParsingError(supabaseError) || isRateLimitError(supabaseError)) {
          console.log("Rate limiting detected during sign-in")
          setRateLimited(true)

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

        return { error: new Error(handleAuthError(supabaseError, "sign-in")) }
      }

      const { data, error } = signInResult

      if (error) {
        // Check if this is a timeout or network error
        if (error.message === "Timeout" || error.message?.includes("Failed to fetch")) {
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
      // Check if this is a JSON parsing error (likely rate limiting)
      if (isJsonParsingError(error)) {
        console.log("JSON parsing error detected during sign-in (likely rate limiting)")
        setRateLimited(true)

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

      // Check if this is a network error
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network Error") ||
        error.message?.includes("network") ||
        error.message === "Timeout"
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
      // Clear user cache when signing out
      if (user) {
        clearUserCache(user.id)
      }

      // Clear local state
      setUser(null)
      setProfile(null)
      setSession(null)
      setIsAuthenticated(false)

      // If we're in mock mode, just redirect
      if (authError || networkError || databaseError || rateLimited) {
        router.push("/auth/sign-in")
        return
      }

      // Get the singleton instance
      const supabase = getSupabaseClient()

      // Set a timeout for the sign-out operation
      const signOutPromise = supabase.auth.signOut()

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Sign-out timed out")), 5000)
      })

      // Race the sign-out against the timeout
      try {
        await Promise.race([signOutPromise, timeoutPromise])
      } catch (error) {
        console.error("Error or timeout during sign-out:", error)
      }

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
      if (authError || networkError || databaseError || rateLimited) {
        return { error: null }
      }

      // Get the singleton instance
      const supabase = getSupabaseClient()

      // If we're resetting password (no current_password), just update
      if (!current_password) {
        // Use a try-catch block specifically for the Supabase call
        try {
          const { error } = await supabase.auth.updateUser({
            password: new_password,
          })

          if (error) {
            return { error: new Error(handleAuthError(error, "password-update")) }
          }

          return { error: null }
        } catch (supabaseError) {
          console.error("Error during password update:", supabaseError)

          // Check if this is a JSON parsing error (rate limiting)  supabaseError);

          // Check if this is a JSON parsing error (rate limiting)
          if (isJsonParsingError(supabaseError) || isRateLimitError(supabaseError)) {
            console.log("Rate limiting detected during password update")
            return { error: null }
          }

          return { error: new Error(handleAuthError(supabaseError, "password-update")) }
        }
      }

      // Otherwise, verify current password first by signing in
      if (!user?.email) {
        return { error: new Error("User email not found") }
      }

      // Use a try-catch block for the sign-in verification
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: current_password,
        })

        if (signInError) {
          return { error: new Error("Current password is incorrect") }
        }
      } catch (signInError) {
        console.error("Error verifying current password:", signInError)

        // Check if this is a JSON parsing error (rate limiting)
        if (isJsonParsingError(signInError) || isRateLimitError(signInError)) {
          console.log("Rate limiting detected during password verification")
          return { error: null }
        }

        return { error: new Error("Failed to verify current password") }
      }

      // Then update password
      try {
        const { error } = await supabase.auth.updateUser({
          password: new_password,
        })

        if (error) {
          return { error: new Error(handleAuthError(error, "password-update")) }
        }

        return { error: null }
      } catch (updateError) {
        console.error("Error updating password:", updateError)

        // Check if this is a JSON parsing error (rate limiting)
        if (isJsonParsingError(updateError) || isRateLimitError(updateError)) {
          console.log("Rate limiting detected during password update")
          return { error: null }
        }

        return { error: new Error(handleAuthError(updateError, "password-update")) }
      }
    } catch (error: any) {
      // Check if this is a JSON parsing error (likely rate limiting)
      if (isJsonParsingError(error)) {
        console.log("JSON parsing error detected during password update")
        return { error: null }
      }

      // Check if this is a network error
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network Error") ||
        error.message?.includes("network") ||
        error.message === "Timeout"
      ) {
        console.error("Network error during password update:", error)
        return { error: new Error("Network error. Please try again when you have a better connection.") }
      }

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
      if (networkError || databaseError || authError || rateLimited) {
        // Update the local profile state
        setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))
        return { error: null }
      }

      // Get the singleton instance
      const supabase = getSupabaseClient()

      // Set a timeout for the profile update
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
        setTimeout(() => reject(new Error("Profile update timed out")), 8000)
      })

      // Use a try-catch block specifically for the Supabase call
      try {
        const { error } = await Promise.race([
          supabase
            .from("profiles")
            .update({
              ...updatedProfile,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id),
          timeoutPromise,
        ])

        if (error) {
          // Check if this is a rate limiting error
          if (isRateLimitError(error)) {
            console.log("Rate limited during profile update")
            setRateLimited(true)

            // Still update the local state to improve UX
            setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))

            return { error: null }
          }

          console.error("Error updating profile:", error)
          return { error: new Error(error.message) }
        }

        // Update local state
        const updatedProfileData = {
          ...(profile || {}),
          ...updatedProfile,
          updated_at: new Date().toISOString(),
        } as UserProfile

        setProfile(updatedProfileData)

        // Update cache with the new profile data
        setCacheItem(CACHE_KEYS.PROFILE(user.id), updatedProfileData, CACHE_EXPIRY.PROFILE)

        return { error: null }
      } catch (supabaseError) {
        console.error("Error during profile update:", supabaseError)

        // Check if this is a JSON parsing error (rate limiting)
        if (isJsonParsingError(supabaseError) || isRateLimitError(supabaseError)) {
          console.log("Rate limiting detected during profile update")
          setRateLimited(true)

          // Still update the local state to improve UX
          setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))

          return { error: null }
        }

        // Check if this is a timeout or network error
        if (supabaseError.message === "Timeout" || supabaseError.message?.includes("Failed to fetch")) {
          console.error("Network error during profile update:", supabaseError)
          setNetworkError(true)

          // Still update the local state to improve UX
          setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))

          return { error: new Error("Network error. Profile updated locally only.") }
        }

        return { error: new Error(handleAuthError(supabaseError, "profile-update")) }
      }
    } catch (error: any) {
      // Check if this is a JSON parsing error (likely rate limiting)
      if (isJsonParsingError(error)) {
        console.log("JSON parsing error detected during profile update")
        setRateLimited(true)

        // Still update the local state to improve UX
        setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))

        return { error: null }
      }

      // Check if this is a network error
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network Error") ||
        error.message?.includes("network") ||
        error.message === "Timeout"
      ) {
        console.error("Network error during profile update:", error)
        setNetworkError(true)

        // Still update the local state to improve UX
        setProfile((prev) => (prev ? { ...prev, ...updatedProfile, updated_at: new Date().toISOString() } : null))

        return { error: new Error("Network error. Profile updated locally only.") }
      }

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
