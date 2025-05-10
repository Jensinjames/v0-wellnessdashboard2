"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import type { UserProfile, ProfileFormData } from "@/types/auth"
import { fetchProfileSafely, createProfileSafely } from "@/utils/profile-utils"
import { getCacheItem, setCacheItem, CACHE_KEYS } from "@/lib/cache-utils"
import { validateAuthCredentials, sanitizeEmail } from "@/utils/auth-validation"
import { useToast } from "@/hooks/use-toast"
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/utils/supabase-client"
import { safeLog, safeError, safeWarn } from "@/utils/safe-console"

// Create a dedicated logger for auth operations
const authLogger = createLogger("Auth")

/**
 * Enable or disable auth debug mode
 * @param enabled Whether to enable debug mode
 */
export function setAuthDebugMode(enabled: boolean): void {
  if (typeof localStorage !== "undefined") {
    if (enabled) {
      localStorage.setItem("auth_debug_mode", "true")
    } else {
      localStorage.removeItem("auth_debug_mode")
    }
  }

  // Update logger configuration
  authLogger.setLevel(enabled ? "debug" : "warn")
}

// Define the shape of our auth context
interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  error: Error | null
  signIn: (
    credentials: { email: string; password: string },
    redirectPath?: string,
  ) => Promise<{
    error: Error | null
    fieldErrors?: { email?: string; password?: string }
    retried?: boolean
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
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error: string | null }>
  isProfileComplete: boolean
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const isMounted = useRef(true)
  const isInitialized = useRef(false)
  const redirectInProgressRef = useRef(false)
  const supabase = getSupabaseClient()

  // Compute if profile is complete
  const isProfileComplete = profile ? Boolean(profile.first_name && profile.last_name && profile.email) : false

  // Initialize auth state
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Get session
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          authLogger.error("Error getting session:", sessionError)
          setIsLoading(false)
          return
        }

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
    // Set up the auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      safeLog("Auth state changed:", event)

      if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setSession(null)
      } else if (event === "SIGNED_IN" && newSession?.user) {
        setSession(newSession)
        setUser(newSession.user)

        // Fetch profile on sign in
        fetchProfileSafely(newSession.user.id).then(({ profile, error }) => {
          if (error) {
            safeError("Error fetching profile after sign in:", error)
          } else if (profile) {
            setProfile(profile)
            // Cache the profile
            setCacheItem(CACHE_KEYS.PROFILE(newSession.user.id), profile)
          }
        })
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        setSession(newSession)
      }

      // Force a router refresh to update server components
      router.refresh()
    })

    return () => {
      authListener.subscription.unsubscribe()
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
      safeError("Error updating profile:", error)
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
        safeError("Invalid credentials object", { credentials })
        return {
          error: new Error("Invalid credentials format"),
          fieldErrors: { email: "Invalid credentials format", password: "Invalid credentials format" },
        }
      }

      // Strictly validate email and password as strings
      if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
        safeError("Invalid credentials types", {
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
        safeWarn("Validation failed for sign-in credentials", validation.errors)
        return {
          error: new Error("Invalid credentials"),
          fieldErrors: validation.errors,
        }
      }

      // Sanitize email
      const sanitizedEmail = sanitizeEmail(credentials.email)
      if (!sanitizedEmail) {
        safeWarn("Email sanitization failed", { email: credentials.email })
        return {
          error: new Error("Invalid email format"),
          fieldErrors: { email: "Invalid email format" },
        }
      }

      safeLog("Attempting sign in", { email: sanitizedEmail })

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: credentials.password,
      })

      if (error) {
        safeError("Sign in error:", error)

        // Special handling for 500 unexpected_failure
        if (error.status === 500) {
          return {
            error: new Error("Authentication service is unavailable. Please try again later."),
          }
        }

        return { error }
      }

      // Check if we have valid user data before proceeding
      if (!data.user) {
        safeError("Sign in error: No user data returned", { email: sanitizedEmail })
        return {
          error: new Error("Authentication failed: No user data returned"),
        }
      }

      // Explicitly update the state with the new session data
      if (data.session) {
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
      safeError("Sign in error:", error)
      return {
        error: new Error(
          error.status === 500
            ? "Authentication service is unavailable. Please try again later."
            : error.message || "An unexpected error occurred",
        ),
      }
    }
  }

  const signUp = async (credentials: { email: string; password: string }) => {
    try {
      // Enhanced validation with detailed logging
      if (!credentials || typeof credentials !== "object") {
        safeError("Invalid credentials object for sign-up", { credentials })
        return {
          error: new Error("Invalid credentials format"),
          fieldErrors: { email: "Invalid credentials format", password: "Invalid credentials format" },
        }
      }

      // Strictly validate email and password as strings
      if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
        safeError("Invalid credentials types for sign-up", {
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
        safeWarn("Validation failed for sign-up credentials", validation.errors)
        return {
          error: new Error("Invalid credentials"),
          fieldErrors: validation.errors,
        }
      }

      // Sanitize email
      const sanitizedEmail = sanitizeEmail(credentials.email)
      if (!sanitizedEmail) {
        safeWarn("Email sanitization failed for sign-up", { email: credentials.email })
        return {
          error: new Error("Invalid email format"),
          fieldErrors: { email: "Invalid email format" },
        }
      }

      safeLog("Attempting sign up", { email: sanitizedEmail })

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: credentials.password,
      })

      if (error) {
        safeError("Sign up error:", error)

        // Special handling for 500 unexpected_failure
        if (error.status === 500) {
          return {
            error: new Error("Authentication service is unavailable. Please try again later."),
          }
        }

        return { error }
      }

      // Explicitly update the state with the new user data if available
      if (data.user) {
        safeLog("User created successfully", { userId: data.user.id, email: sanitizedEmail })
      }

      // Explicitly indicate that an email verification was sent
      return { error: null, emailVerificationSent: true }
    } catch (error: any) {
      safeError("Sign up error:", error)
      return {
        error: new Error(
          error.status === 500
            ? "Authentication service is unavailable. Please try again later."
            : error.message || "An unexpected error occurred",
        ),
      }
    }
  }

  const signOut = async (redirectPath = "/auth/sign-in") => {
    try {
      safeLog("Attempting sign out")

      // Sign out with Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        safeError("Sign out error:", error)
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
    } catch (err) {
      console.error("Error signing out:", err)
      setError(err instanceof Error ? err : new Error("Failed to sign out"))
      safeError("Sign out error:", err)
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
      // Sanitize email
      const sanitizedEmail = sanitizeEmail(email)
      if (!sanitizedEmail) {
        return { success: false, error: "Invalid email format" }
      }

      safeLog("Attempting password reset", { email: sanitizedEmail })

      // Reset password with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail)

      if (error) {
        safeError("Reset password error:", error)

        // Special handling for 500 unexpected_failure
        if (error.status === 500) {
          return {
            success: false,
            error: "Authentication service is unavailable. Please try again later.",
          }
        }

        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      safeError("Reset password error:", error)
      return {
        success: false,
        error:
          error.status === 500
            ? "Authentication service is unavailable. Please try again later."
            : error.message || "Failed to reset password",
      }
    }
  }

  const updatePassword = async (password: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      safeLog("Attempting password update")

      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        safeError("Update password error:", error)

        // Special handling for 500 unexpected_failure
        if (error.status === 500) {
          return {
            success: false,
            error: "Authentication service is unavailable. Please try again later.",
          }
        }

        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      safeError("Update password error:", error)
      return {
        success: false,
        error:
          error.status === 500
            ? "Authentication service is unavailable. Please try again later."
            : error.message || "Failed to update password",
      }
    }
  }

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Sanitize email
      const sanitizedEmail = sanitizeEmail(email)
      if (!sanitizedEmail) {
        return { success: false, error: "Invalid email format" }
      }

      safeLog("Attempting to resend verification email", { email: sanitizedEmail })

      // Resend verification email with Supabase
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: sanitizedEmail,
      })

      if (error) {
        safeError("Resend verification email error:", error)

        // Special handling for 500 unexpected_failure
        if (error.status === 500) {
          return {
            success: false,
            error: "Authentication service is unavailable. Please try again later.",
          }
        }

        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      safeError("Resend verification email error:", error)
      return {
        success: false,
        error:
          error.status === 500
            ? "Authentication service is unavailable. Please try again later."
            : error.message || "Failed to resend verification email",
      }
    }
  }

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) {
      return null
    }

    try {
      setIsLoading(true)

      const { profile: refreshedProfile, error } = await fetchProfileSafely(user.id)

      if (error) {
        safeError("Error fetching profile:", error)
        return null
      }

      if (refreshedProfile) {
        setProfile(refreshedProfile)
        // Cache the refreshed profile
        setCacheItem(CACHE_KEYS.PROFILE(user.id), refreshedProfile)
        return refreshedProfile
      }

      return null
    } catch (error) {
      safeError("Unexpected error refreshing profile:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user])

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
    resendVerificationEmail,
    isProfileComplete,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
