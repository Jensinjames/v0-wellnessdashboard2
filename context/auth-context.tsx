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
import { createLogger } from "@/utils/logger"
import { startDatabaseHeartbeat } from "@/utils/db-heartbeat"
import {
  getSupabase,
  addAuthListener,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  supabaseResetPassword,
  supabaseUpdatePassword,
  checkEmailServiceAvailability,
} from "@/lib/supabase-manager"

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
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null; isEmailError?: boolean }>
  updatePassword: (password: string) => Promise<{ success: boolean; error: string | null }>
  isProfileComplete: boolean
  checkEmailService: () => Promise<boolean>
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

        // Start the database heartbeat to keep the connection pool warm
        startDatabaseHeartbeat()

        // Get the Supabase client
        const supabase = getSupabase()

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
    const removeListener = addAuthListener((event, payload) => {
      if (!isMounted.current) return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setSession(null)
      } else if (event === "SIGNED_IN" && payload.session?.user) {
        setSession(payload.session)
        setUser(payload.session.user)

        // Fetch profile on sign in
        fetchProfileSafely(payload.session.user.id).then(({ profile, error }) => {
          if (error) {
            authLogger.error("Error fetching profile after sign in:", error)
          } else if (profile) {
            setProfile(profile)
            // Cache the profile
            setCacheItem(CACHE_KEYS.PROFILE(payload.session.user.id), profile)
          }
        })
      } else if (event === "TOKEN_REFRESHED" && payload.session) {
        setSession(payload.session)
      }

      // Refresh the page to update server components
      router.refresh()
    })

    return () => {
      removeListener()
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

      // Attempt sign-in with validated credentials
      const { data, error } = await signInWithEmail(sanitizedEmail, credentials.password)

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
      const { data, error } = await signUpWithEmail(sanitizedEmail, credentials.password)

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
      const { error } = await supabaseSignOut()

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

  const resetPassword = async (
    email: string,
  ): Promise<{ success: boolean; error: string | null; isEmailError?: boolean }> => {
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

      // Add the redirectTo option with the correct URL
      const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || ""
      const redirectTo = `${origin}/auth/reset-password`

      // Check if we're in development mode with mock email success enabled
      if (
        process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development" &&
        process.env.NEXT_PUBLIC_MOCK_EMAIL_SUCCESS === "true"
      ) {
        authLogger.info("Development mode: Mocking successful password reset email")
        console.log(`[DEV MODE] Password reset link would be sent to ${sanitizedEmail}`)
        console.log(`[DEV MODE] Redirect URL would be: ${redirectTo}`)
        return { success: true, error: null }
      }

      // Attempt to send the password reset email
      const { error } = await supabaseResetPassword(sanitizedEmail, {
        redirectTo,
      })

      if (error) {
        authLogger.error("Reset password error:", error)
        return {
          success: false,
          error: error.message || "Failed to reset password",
          isEmailError: error.message?.includes("sending email") || error.message?.includes("500"),
        }
      }

      return { success: true, error: null }
    } catch (error: any) {
      authLogger.error("Reset password error:", error)
      return {
        success: false,
        error: error.message || "Failed to reset password",
        isEmailError: error.message?.includes("sending email") || error.message?.includes("500"),
      }
    }
  }

  const updatePassword = async (password: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Validate password strength
      if (!validatePassword(password)) {
        return { success: false, error: "Password must be at least 8 characters long" }
      }

      authLogger.info("Attempting password update")
      const { error } = await supabaseUpdatePassword(password)

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

      const supabase = getSupabase()
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

  // Check if email service is available
  const checkEmailService = async (): Promise<boolean> => {
    return await checkEmailServiceAvailability()
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
    checkEmailService,
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
