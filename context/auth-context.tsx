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
import { authService } from "@/lib/auth-service"
import { useSupabaseContext } from "@/components/providers/supabase-provider"

// Create a dedicated logger for auth operations
const authLogger = createLogger("Auth")

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
  const { supabase, isLoading: isSupabaseLoading } = useSupabaseContext()
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

  // Compute if profile is complete
  const isProfileComplete = profile ? Boolean(profile.first_name && profile.last_name && profile.email) : false

  // Initialize auth state
  useEffect(() => {
    if (!supabase || isSupabaseLoading) return
    if (isInitialized.current) return
    isInitialized.current = true

    async function getInitialSession() {
      try {
        setIsLoading(true)

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        setSession(data.session)
        setUser(data.session?.user || null)
      } catch (err) {
        console.error("Error getting initial session:", err)
        setError(err instanceof Error ? err : new Error("Failed to get initial session"))
      } finally {
        setIsLoading(false)
      }
    }

    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Get session using our auth service
        const { session: initialSession, error: sessionError } = await authService.getSession()

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

    getInitialSession()
    initializeAuth()

    return () => {
      isMounted.current = false
    }
  }, [supabase, isSupabaseLoading, router])

  // Set up auth state change listener
  useEffect(() => {
    if (!supabase) return
    // Set up the auth state change listener using our auth service
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, newSession) => {
      if (!isMounted.current) return

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
            authLogger.error("Error fetching profile after sign in:", error)
          } else if (profile) {
            setProfile(profile)
            // Cache the profile
            setCacheItem(CACHE_KEYS.PROFILE(newSession.user.id), profile)
          }
        })
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        setSession(newSession)
      }

      // Refresh the page to update server components
      router.refresh()
    })

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user || null)

      // Force a router refresh to update server components
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
      authListener.subscription.unsubscribe()
    }
  }, [supabase, router])

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

      // Use our auth service to sign in with retry mechanism
      const {
        user: signedInUser,
        session: newSession,
        error,
        retried,
      } = await authService.signIn(sanitizedEmail, credentials.password)

      if (error) {
        // Special handling for 500 unexpected_failure
        if (error?.__isAuthError && error?.status === 500 && error?.code === "unexpected_failure") {
          authLogger.error("Authentication service error (500):", { error, email: sanitizedEmail })
          return {
            error: new Error("Authentication service temporarily unavailable. Please try again."),
            retried,
          }
        }

        authLogger.error("Sign in error:", { error, email: sanitizedEmail })
        return { error, retried }
      }

      // Check if we have valid user data before proceeding
      if (!signedInUser) {
        authLogger.error("Sign in error: No user data returned", { email: sanitizedEmail })
        return {
          error: new Error("Authentication failed: No user data returned"),
          retried,
        }
      }

      // Explicitly update the state with the new session data
      if (newSession) {
        setSession(newSession)
        setUser(signedInUser)

        // Fetch and update the profile as well
        if (signedInUser) {
          const { profile: fetchedProfile } = await fetchProfileSafely(signedInUser.id)
          if (fetchedProfile) {
            setProfile(fetchedProfile)
            // Cache the profile
            setCacheItem(CACHE_KEYS.PROFILE(signedInUser.id), fetchedProfile)
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

      return { error: null, retried }
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

      // Use our auth service to sign up
      const {
        user: newUser,
        error,
        emailVerificationSent,
      } = await authService.signUp(sanitizedEmail, credentials.password)

      if (error) {
        authLogger.error("Sign up error:", { error, email: sanitizedEmail })
        return { error }
      }

      // Explicitly update the state with the new user data if available
      if (newUser) {
        authLogger.info("User created successfully", { userId: newUser.id, email: sanitizedEmail })
      }

      // Explicitly indicate that an email verification was sent
      return { error: null, emailVerificationSent }
    } catch (error: any) {
      authLogger.error("Sign up error:", error)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const signOut = async (redirectPath = "/auth/sign-in") => {
    if (!supabase) return
    try {
      authLogger.info("Attempting sign out")

      // Use our auth service to sign out
      const { error } = await authService.signOut()

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
    } catch (err) {
      console.error("Error signing out:", err)
      setError(err instanceof Error ? err : new Error("Failed to sign out"))
      authLogger.error("Sign out error:", err)
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

      // Use our auth service to reset password with retry mechanism
      const { error, retried } = await authService.resetPassword(sanitizedEmail)

      if (error) {
        // Special handling for 500 unexpected_failure that couldn't be resolved with retries
        if (error?.__isAuthError && error?.status === 500 && error?.code === "unexpected_failure") {
          authLogger.error("Authentication service error (500) during password reset:", {
            error,
            email: sanitizedEmail,
          })
          return {
            success: false,
            error: retried
              ? "Authentication service is currently unavailable. Please try again later."
              : "Authentication service temporarily unavailable. Please try again.",
          }
        }

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

      // Use our auth service to update password
      const { error } = await authService.updatePassword(password)

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

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error: string | null }> => {
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

      authLogger.info("Attempting to resend verification email", { email: sanitizedEmail })

      // Use our auth service to resend verification email
      const { error } = await authService.resendVerificationEmail(sanitizedEmail)

      if (error) {
        authLogger.error("Resend verification email error:", { error, email: sanitizedEmail })
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      authLogger.error("Resend verification email error:", error)
      return { success: false, error: error.message || "Failed to resend verification email" }
    }
  }

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!user) {
      return null
    }

    try {
      setIsLoading(true)

      const { profile: refreshedProfile, error } = await fetchProfileSafely(user.id)

      if (error) {
        authLogger.error("Error fetching profile:", error)
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
    isLoading: isLoading || isSupabaseLoading,
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

// Debug mode control function
export function setAuthDebugMode(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_debug", enabled ? "true" : "false")
    console.log(`Auth context debug mode ${enabled ? "enabled" : "disabled"}`)
  }
}
