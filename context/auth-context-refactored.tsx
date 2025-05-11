/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseAuthProvider } from "@/lib/auth/supabase-auth-provider"
import type {
  AuthUser,
  AuthSession,
  AuthCredentials,
  AuthResult,
  PasswordResetResult,
  PasswordUpdateResult,
} from "@/lib/auth/types"
import { createLogger } from "@/utils/logger"
import type { UserProfile, ProfileFormData } from "@/types/auth"
import { fetchProfileSafely, createProfileSafely } from "@/utils/profile-utils"
import { getCacheItem, setCacheItem, CACHE_KEYS } from "@/lib/cache-utils"

const logger = createLogger("AuthContext")

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  session: AuthSession | null
  isLoading: boolean
  signIn: (credentials: AuthCredentials, redirectPath?: string) => Promise<AuthResult>
  signUp: (credentials: AuthCredentials) => Promise<AuthResult>
  signOut: (redirectPath?: string) => Promise<void>
  refreshProfile: () => Promise<UserProfile | null>
  updateProfile: (data: ProfileFormData) => Promise<{ success: boolean; error: Error | null }>
  resetPassword: (email: string) => Promise<PasswordResetResult>
  updatePassword: (password: string) => Promise<PasswordUpdateResult>
  isProfileComplete: boolean
  handleOtpExpired: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const isMounted = useRef(true)
  const isInitialized = useRef(false)
  const redirectInProgressRef = useRef(false)
  const authProvider = getSupabaseAuthProvider()

  // Compute if profile is complete
  const isProfileComplete = profile ? Boolean(profile.first_name && profile.last_name && profile.email) : false

  // Initialize auth state
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        logger.debug("Initializing auth state")

        // Get current session
        const initialSession = await authProvider.getSession()

        if (initialSession?.user) {
          logger.debug("User is authenticated, setting session and user")
          setSession(initialSession)
          setUser(initialSession.user)

          // Check cache first for profile data
          const cachedProfile = getCacheItem<UserProfile>(CACHE_KEYS.PROFILE(initialSession.user.id))

          if (cachedProfile) {
            logger.debug("Using cached profile data")
            setProfile(cachedProfile)
            setIsLoading(false)
          } else {
            // Fetch profile
            try {
              logger.debug("Fetching profile data")
              const { profile: fetchedProfile, error } = await fetchProfileSafely(initialSession.user.id)

              if (error) {
                logger.error("Error fetching profile:", error)

                // If no profile found, try to create one
                if (initialSession.user.email) {
                  logger.debug("No profile found, creating one")
                  const { profile: createdProfile, error: createError } = await createProfileSafely(
                    initialSession.user.id,
                    initialSession.user.email,
                  )

                  if (createError) {
                    logger.error("Error creating profile:", createError)
                  } else if (createdProfile) {
                    logger.debug("Profile created successfully")
                    setProfile(createdProfile)
                    // Cache the profile
                    setCacheItem(CACHE_KEYS.PROFILE(initialSession.user.id), createdProfile)
                  }
                }
              } else if (fetchedProfile) {
                logger.debug("Profile fetched successfully")
                setProfile(fetchedProfile)
                // Cache the profile
                setCacheItem(CACHE_KEYS.PROFILE(initialSession.user.id), fetchedProfile)
              }
            } catch (err) {
              logger.error("Unexpected error in profile initialization:", err)
            } finally {
              if (isMounted.current) {
                setIsLoading(false)
              }
            }
          }
        } else {
          logger.debug("User is not authenticated")
          setIsLoading(false)
        }
      } catch (error) {
        logger.error("Error initializing auth:", error)
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
    const removeListener = authProvider.onAuthStateChange((event, newSession) => {
      if (!isMounted.current) return

      logger.debug("Auth state change:", event)

      if (event === "SIGNED_OUT") {
        logger.debug("User signed out, clearing state")
        setUser(null)
        setProfile(null)
        setSession(null)
      } else if (event === "SIGNED_IN" && newSession?.user) {
        logger.debug("User signed in, updating state")
        setSession(newSession)
        setUser(newSession.user)

        // Fetch profile on sign in
        fetchProfileSafely(newSession.user.id).then(({ profile, error }) => {
          if (error) {
            logger.error("Error fetching profile after sign in:", error)
          } else if (profile) {
            logger.debug("Profile fetched after sign in")
            setProfile(profile)
            // Cache the profile
            setCacheItem(CACHE_KEYS.PROFILE(newSession.user.id), profile)
          }
        })
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        logger.debug("Token refreshed, updating session")
        setSession(newSession)
      } else if (event === "OTP_EXPIRED") {
        logger.debug("OTP expired, redirecting to forgot password")
        router.push("/auth/forgot-password?error=expired")
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
      logger.debug("Updating profile for user", user.id, data)

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
        logger.error("Error updating profile:", responseData.error)
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
      logger.error("Error updating profile:", error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  const signIn = async (credentials: AuthCredentials, redirectPath?: string): Promise<AuthResult> => {
    try {
      logger.debug("Attempting sign in", { email: credentials.email })

      const result = await authProvider.signIn(credentials)

      if (result.success && result.session) {
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

      return result
    } catch (error) {
      logger.error("Sign in error:", error)
      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  const signUp = async (credentials: AuthCredentials): Promise<AuthResult> => {
    try {
      logger.debug("Attempting sign up", { email: credentials.email })

      const result = await authProvider.signUp(credentials)

      return result
    } catch (error) {
      logger.error("Sign up error:", error)
      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  const signOut = async (redirectPath = "/auth/sign-in"): Promise<void> => {
    try {
      logger.debug("Attempting sign out")

      await authProvider.signOut()

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
      logger.error("Sign out error:", error)
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

  const resetPassword = async (email: string): Promise<PasswordResetResult> => {
    try {
      logger.debug("Attempting password reset", { email })

      return await authProvider.resetPassword(email)
    } catch (error) {
      logger.error("Reset password error:", error)
      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  const updatePassword = async (password: string): Promise<PasswordUpdateResult> => {
    try {
      logger.debug("Attempting password update")

      return await authProvider.updatePassword(password)
    } catch (error) {
      logger.error("Update password error:", error)
      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!user) {
      return null
    }

    try {
      logger.debug("Refreshing profile for user", user.id)
      setIsLoading(true)

      const { profile: fetchedProfile, error } = await fetchProfileSafely(user.id)

      if (error) {
        logger.error("Error fetching profile:", error)
        return null
      }

      if (fetchedProfile) {
        setProfile(fetchedProfile)
        // Cache the refreshed profile
        setCacheItem(CACHE_KEYS.PROFILE(user.id), fetchedProfile)
        return fetchedProfile
      }

      return null
    } catch (error) {
      logger.error("Unexpected error refreshing profile:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP expired error
  const handleOtpExpired = async (): Promise<void> => {
    logger.debug("Handling OTP expired error")
    router.push("/auth/forgot-password?error=expired")
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
    handleOtpExpired,
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
