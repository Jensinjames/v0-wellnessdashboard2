/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User, Session } from "@supabase/supabase-js"
import type { UserProfile, ProfileFormData } from "@/types/auth"
import { fetchProfileSafely, createProfileSafely } from "@/utils/profile-utils"
import { getCacheItem, setCacheItem, CACHE_KEYS } from "@/lib/cache-utils"
import { validateAuthCredentials, sanitizeEmail, validateEmail, validatePassword } from "@/utils/auth-validation"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase-client-core"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger for auth operations
const authLogger = createLogger("Auth")

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signIn: (
    credentials: { email: string; password: string },
    redirectPath?: string,
  ) => Promise<{
    error: Error | null
    fieldErrors?: { email?: string; password?: string }
  }>
  signUp: (credentials: { email: string; password: string }) => Promise<{
    error: Error | null
    fieldErrors?: { email?: string; password?: string }
    emailVerificationSent?: boolean
  }>
  signOut: (redirectPath?: string) => Promise<void>
  refreshProfile: () => Promise<UserProfile | null>
  updateProfile: (data: ProfileFormData) => Promise<{ success: boolean; error: Error | null }>
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>
  updatePassword: (password: string) => Promise<{ success: boolean; error: string | null }>
  isProfileComplete: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const isMounted = useRef(true)
  const isInitialized = useRef(false)
  const redirectInProgressRef = useRef(false)

  // Compute if profile is complete
  const isProfileComplete = profile ? Boolean(profile.first_name && profile.last_name && profile.email) : false

  // Initialize auth state
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Get the Supabase client using our consolidated implementation
        const supabase = getSupabaseClient()

        // Get session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (initialSession?.user) {
          setSession(initialSession)
          setUser(initialSession.user)

          // Check cache first for profile data
          const cachedProfile = getCacheItem<UserProfile>(CACHE_KEYS.PROFILE(initialSession.user.id))

          if (cachedProfile) {
            setProfile(cachedProfile)
            setIsLoading(false)
          } else {
            // Fetch profile
            try {
              const { profile: fetchedProfile, error } = await fetchProfileSafely(initialSession.user.id)

              if (error) {
                authLogger.error("Error fetching profile:", error)

                // If no profile found, try to create one
                if (initialSession.user.email) {
                  const { profile: createdProfile, error: createError } = await createProfileSafely(
                    initialSession.user.id,
                    initialSession.user.email,
                  )

                  if (createError) {
                    authLogger.error("Error creating profile:", createError)
                  } else if (createdProfile) {
                    setProfile(createdProfile)
                    // Cache the profile
                    setCacheItem(CACHE_KEYS.PROFILE(initialSession.user.id), createdProfile)
                  }
                }
              } else if (fetchedProfile) {
                setProfile(fetchedProfile)
                // Cache the profile
                setCacheItem(CACHE_KEYS.PROFILE(initialSession.user.id), fetchedProfile)
              }
            } catch (err) {
              authLogger.error("Unexpected error in profile initialization:", err)
            } finally {
              if (isMounted.current) {
                setIsLoading(false)
              }
            }
          }
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        authLogger.error("Error initializing auth:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()

    return () => {
      isMounted.current = false
    }
  }, [])

  // Set up auth state change listener
  useEffect(() => {
    const supabase = getSupabaseClient()

    // Set up the auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setSession(null)
      } else if (event === "SIGNED_IN" && session?.user) {
        setSession(session)
        setUser(session.user)

        // Fetch profile on sign in
        fetchProfileSafely(session.user.id).then(({ profile, error }) => {
          if (error) {
            authLogger.error("Error fetching profile after sign in:", error)
          } else if (profile) {
            setProfile(profile)
            // Cache the profile
            setCacheItem(CACHE_KEYS.PROFILE(session.user.id), profile)
          }
        })
      } else if (event === "TOKEN_REFRESHED" && session) {
        setSession(session)
      }

      // Refresh the page to update server components
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Update profile function that uses server action instead of direct database access
  const updateProfile = async (data: ProfileFormData): Promise<{ success: boolean; error: Error | null }> => {
    if (!user) {
      return { success: false, error: new Error("User not authenticated") }
    }

    try {
      // Use the server action to update the profile
      const result = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          profile: data,
        }),
      })

      const responseData = await result.json()

      if (!result.ok) {
        return {
          success: false,
          error: new Error(responseData.error || "Failed to update profile"),
        }
      }

      // Update local profile state with the new data
      if (profile) {
        const updatedProfile = {
          ...profile,
          ...data,
          updated_at: new Date().toISOString(),
        }
        setProfile(updatedProfile)
        // Cache the profile
        setCacheItem(CACHE_KEYS.PROFILE(user.id), updatedProfile)
      }

      return { success: true, error: null }
    } catch (error) {
      authLogger.error("Error updating profile:", error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  // Helper function to retry authentication with exponential backoff
  const retryAuthentication = async (email: string, password: string, attempt = 1, maxAttempts = 3): Promise<any> => {
    try {
      // Get the Supabase client
      const supabase = getSupabaseClient()

      // Attempt sign-in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // If successful or it's not a 500 unexpected_failure, return the result
      if (
        !error ||
        !(
          error?.__isAuthError &&
          error?.name === "AuthApiError" &&
          error?.status === 500 &&
          error?.code === "unexpected_failure"
        )
      ) {
        return { data, error }
      }

      // If we've reached max attempts, return the error
      if (attempt >= maxAttempts) {
        authLogger.warn(`Authentication failed after ${maxAttempts} attempts`, { email })
        return { data, error }
      }

      // Calculate backoff delay with jitter (100ms, 200ms, 400ms base times with jitter)
      const delay = Math.floor(2 ** (attempt - 1) * 100 * (0.75 + Math.random() * 0.5))

      // Log retry attempt
      authLogger.info(`Retrying authentication (attempt ${attempt + 1}/${maxAttempts}) after ${delay}ms delay`, {
        email,
      })

      // Wait for the backoff period
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Retry with incremented attempt counter
      return retryAuthentication(email, password, attempt + 1, maxAttempts)
    } catch (error) {
      authLogger.error("Error in retry mechanism:", error)
      return { data: null, error }
    }
  }

  const signIn = async (credentials: { email: string; password: string }, redirectPath?: string) => {
    try {
      // Enhanced validation with detailed logging
      if (!credentials || typeof credentials !== "object") {
        authLogger.error("Invalid credentials object", { credentials })
        return {
          error: new Error("Invalid credentials format"),
          fieldErrors: { email: "Invalid credentials format", password: "Invalid credentials format" },
        }
      }

      // Strictly validate email and password as strings
      if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
        authLogger.error("Invalid credentials types", {
          emailType: typeof credentials.email,
          passwordType: typeof credentials.password,
        })
        return {
          error: new Error("Invalid credentials format"),
          fieldErrors: {
            email: typeof credentials.email !== "string" ? "Invalid email format" : undefined,
            password: typeof credentials.password !== "string" ? "Invalid password format" : undefined,
          },
        }
      }

      // Validate email and password content
      const validation = validateAuthCredentials(credentials.email, credentials.password)

      if (!validation.valid) {
        authLogger.warn("Validation failed for sign-in credentials", validation.errors)
        return {
          error: new Error("Invalid credentials"),
          fieldErrors: validation.errors,
        }
      }

      // Sanitize email
      const sanitizedEmail = sanitizeEmail(credentials.email)
      if (!sanitizedEmail) {
        authLogger.warn("Email sanitization failed", { email: credentials.email })
        return {
          error: new Error("Invalid email format"),
          fieldErrors: { email: "Invalid email format" },
        }
      }

      authLogger.info("Attempting sign in", { email: sanitizedEmail })

      // Get the Supabase client using our consolidated implementation
      const supabase = getSupabaseClient()

      // Attempt sign-in with validated credentials and retry mechanism
      const { data, error } = await retryAuthentication(sanitizedEmail, credentials.password)

      if (error) {
        authLogger.error("Sign in error:", { error, email: sanitizedEmail })
        return { error }
      }

      // Check if we have valid user data before proceeding
      if (!data?.user) {
        authLogger.error("Sign in error: No user data returned", { email: sanitizedEmail })
        return { error: new Error("Authentication failed: No user data returned") }
      }

      // Explicitly update the state with the new session data
      if (data?.session) {
        setSession(data.session)
        setUser(data.user)

        // Fetch and update the profile as well
        if (data.user) {
          const { profile: fetchedProfile } = await fetchProfileSafely(data.user.id)
          if (fetchedProfile) {
            setProfile(fetchedProfile)
            // Cache the profile
            setCacheItem(CACHE_KEYS.PROFILE(data.user.id), fetchedProfile)
          }
        }

        // Handle redirect after successful sign-in
        if (!redirectInProgressRef.current && redirectPath) {
          redirectInProgressRef.current = true

          // Redirect to the specified path or dashboard
          setTimeout(() => {
            router.push(redirectPath || "/dashboard")
            redirectInProgressRef.current = false
          }, 100)
        }
      }

      return { error: null }
    } catch (error: any) {
      authLogger.error("Sign in error:", error)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const signUp = async (credentials: { email: string; password: string }) => {
    try {
      // Enhanced validation with detailed logging
      if (!credentials || typeof credentials !== "object") {
        authLogger.error("Invalid credentials object for sign-up", { credentials })
        return {
          error: new Error("Invalid credentials format"),
          fieldErrors: { email: "Invalid credentials format", password: "Invalid credentials format" },
        }
      }

      // Strictly validate email and password as strings
      if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
        authLogger.error("Invalid credentials types for sign-up", {
          emailType: typeof credentials.email,
          passwordType: typeof credentials.password,
        })
        return {
          error: new Error("Invalid credentials format"),
          fieldErrors: {
            email: typeof credentials.email !== "string" ? "Invalid email format" : undefined,
            password: typeof credentials.password !== "string" ? "Invalid password format" : undefined,
          },
        }
      }

      // Validate email and password content
      const validation = validateAuthCredentials(credentials.email, credentials.password)

      if (!validation.valid) {
        authLogger.warn("Validation failed for sign-up credentials", validation.errors)
        return {
          error: new Error("Invalid credentials"),
          fieldErrors: validation.errors,
        }
      }

      // Sanitize email
      const sanitizedEmail = sanitizeEmail(credentials.email)
      if (!sanitizedEmail) {
        authLogger.warn("Email sanitization failed for sign-up", { email: credentials.email })
        return {
          error: new Error("Invalid email format"),
          fieldErrors: { email: "Invalid email format" },
        }
      }

      authLogger.info("Attempting sign up", { email: sanitizedEmail })

      // Get the Supabase client using our consolidated implementation
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: credentials.password,
      })

      if (error) {
        authLogger.error("Sign up error:", { error, email: sanitizedEmail })
        return { error }
      }

      // Explicitly update the state with the new session data if available
      // Note: For sign-up with email confirmation, there might not be a session yet
      if (data?.user) {
        authLogger.info("User created successfully", { userId: data.user.id, email: sanitizedEmail })
      }

      // Explicitly indicate that an email verification was sent
      return { error: null, emailVerificationSent: true }
    } catch (error: any) {
      authLogger.error("Sign up error:", error)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const signOut = async (redirectPath = "/auth/sign-in") => {
    try {
      authLogger.info("Attempting sign out")

      // Get the Supabase client using our consolidated implementation
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.signOut()

      if (error) {
        authLogger.error("Sign out error:", error)
      }

      // Explicitly clear state
      setUser(null)
      setProfile(null)
      setSession(null)

      // Redirect to sign-in page
      if (!redirectInProgressRef.current) {
        redirectInProgressRef.current = true
        setTimeout(() => {
          router.push(redirectPath)
          redirectInProgressRef.current = false
        }, 100)
      }
    } catch (error) {
      authLogger.error("Sign out error:", error)
      // Even if there's an error, clear the local state
      setUser(null)
      setProfile(null)
      setSession(null)

      if (!redirectInProgressRef.current) {
        redirectInProgressRef.current = true
        setTimeout(() => {
          router.push(redirectPath)
          redirectInProgressRef.current = false
        }, 100)
      }
    }
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Validate email format
      if (!validateEmail(email)) {
        return { success: false, error: "Please enter a valid email address" }
      }

      // Sanitize email
      const sanitizedEmail = sanitizeEmail(email)
      if (!sanitizedEmail) {
        return { success: false, error: "Invalid email format" }
      }

      authLogger.info("Attempting password reset", { email: sanitizedEmail })

      // Get the Supabase client using our consolidated implementation
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail)

      if (error) {
        authLogger.error("Reset password error:", { error, email: sanitizedEmail })
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      authLogger.error("Reset password error:", error)
      return { success: false, error: error.message || "Failed to reset password" }
    }
  }

  const updatePassword = async (password: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Validate password strength
      if (!validatePassword(password)) {
        return { success: false, error: "Password must be at least 8 characters long" }
      }

      authLogger.info("Attempting password update")

      // Get the Supabase client using our consolidated implementation
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        authLogger.error("Update password error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      authLogger.error("Update password error:", error)
      return { success: false, error: error.message || "Failed to update password" }
    }
  }

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!user) {
      return null
    }

    try {
      setIsLoading(true)

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        authLogger.error("Error fetching profile:", error)
        return null
      }

      if (data) {
        setProfile(data)
        // Cache the refreshed profile
        setCacheItem(CACHE_KEYS.PROFILE(user.id), data)
        return data
      }

      return null
    } catch (error) {
      authLogger.error("Unexpected error refreshing profile:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile,
    resetPassword,
    updatePassword,
    isProfileComplete,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Export the useAuth hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Debug mode control function
export function setAuthDebugMode(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_debug", enabled ? "true" : "false")
    console.log(`Auth context debug mode ${enabled ? "enabled" : "disabled"}`)
  }
}
