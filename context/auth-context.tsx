"use client"

import { useRouter } from "next/navigation"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User, Session } from "@supabase/supabase-js"
import type { UserProfile, ProfileFormData } from "@/types/auth"
import { fetchProfileSafely, createProfileSafely } from "@/utils/profile-utils"
import { getCacheItem, setCacheItem, CACHE_KEYS } from "@/lib/cache-utils"
import { validateAuthCredentials, sanitizeEmail } from "@/utils/auth-validation"
import { resetSupabaseClient } from "@/lib/supabase-client"
import { getSupabaseClient } from "@/lib/supabase-singleton"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signIn: (credentials: { email: string; password: string }) => Promise<{
    error: Error | null
    mockSignIn?: boolean
    fieldErrors?: { email?: string; password?: string }
  }>
  signUp: (credentials: { email: string; password: string }) => Promise<{
    error: Error | null
    mockSignUp?: boolean
    networkIssue?: boolean
    fieldErrors?: { email?: string; password?: string }
    emailVerificationSent?: boolean
  }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<UserProfile | null>
  updateProfile: (data: ProfileFormData) => Promise<{ success: boolean; error: Error | null }>
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>
  updatePassword: (password: string) => Promise<{ success: boolean; error: string | null }>
  getClientInfo: () => any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Debug mode flag
let authDebugMode = process.env.NODE_ENV === "development"

// Enable/disable debug logging
export function setAuthDebugMode(enabled: boolean): void {
  authDebugMode = enabled
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_debug", enabled ? "true" : "false")
  }
  console.log(`Auth debug mode ${enabled ? "enabled" : "disabled"}`)
}

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (authDebugMode) {
    console.log("[Auth Context]", ...args)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()
  const isMounted = useRef(true)
  const isInitialized = useRef(false)

  // Initialize auth state
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializeAuth = async () => {
      try {
        debugLog("Initializing auth state")
        // Get session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (initialSession?.user) {
          debugLog("User is authenticated, setting session and user")
          setSession(initialSession)
          setUser(initialSession.user)

          // Check cache first for profile data
          const cachedProfile = getCacheItem<UserProfile>(CACHE_KEYS.PROFILE(initialSession.user.id))

          if (cachedProfile) {
            debugLog("Using cached profile data")
            setProfile(cachedProfile)
            setIsLoading(false)
          } else {
            // Fetch profile with a slight delay to allow other components to initialize
            setTimeout(async () => {
              if (!isMounted.current) return

              try {
                debugLog("Fetching profile data")
                const { profile: fetchedProfile, error } = await fetchProfileSafely(initialSession.user.id)

                if (error) {
                  console.error("Error fetching profile:", error)

                  // If no profile found, try to create one
                  if (initialSession.user.email) {
                    debugLog("No profile found, creating one")
                    const { profile: createdProfile, error: createError } = await createProfileSafely(
                      initialSession.user.id,
                      initialSession.user.email,
                    )

                    if (createError) {
                      console.error("Error creating profile:", createError)
                    } else if (createdProfile) {
                      debugLog("Profile created successfully")
                      setProfile(createdProfile)
                      // Cache the profile
                      setCacheItem(CACHE_KEYS.PROFILE(initialSession.user.id), createdProfile)
                    }
                  }
                } else if (fetchedProfile) {
                  debugLog("Profile fetched successfully")
                  setProfile(fetchedProfile)
                  // Cache the profile
                  setCacheItem(CACHE_KEYS.PROFILE(initialSession.user.id), fetchedProfile)
                }
              } catch (err) {
                console.error("Unexpected error in profile initialization:", err)
              } finally {
                if (isMounted.current) {
                  setIsLoading(false)
                }
              }
            }, 500)
          }
        } else {
          debugLog("User is not authenticated")
          setIsLoading(false)
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
          debugLog("Auth state change:", event)

          if (event === "SIGNED_OUT") {
            debugLog("User signed out, clearing state")
            setUser(null)
            setProfile(null)
            setSession(null)
            // Reset the client to ensure a clean state
            resetSupabaseClient()
          } else if (event === "SIGNED_IN" && newSession?.user) {
            debugLog("User signed in, updating state")
            setSession(newSession)
            setUser(newSession.user)

            // Fetch profile on sign in
            fetchProfileSafely(newSession.user.id).then(({ profile, error }) => {
              if (error) {
                console.error("Error fetching profile after sign in:", error)
              } else if (profile) {
                debugLog("Profile fetched after sign in")
                setProfile(profile)
                // Cache the profile
                setCacheItem(CACHE_KEYS.PROFILE(newSession.user.id), profile)
              }
            })
          } else if (event === "TOKEN_REFRESHED" && newSession) {
            debugLog("Token refreshed, updating session")
            setSession(newSession)
          }

          // Refresh the page to update server components
          router.refresh()
        })

        return () => {
          debugLog("Cleaning up auth state change listener")
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()

    return () => {
      isMounted.current = false
    }
  }, [supabase, router])

  // Update profile function that uses server action instead of direct database access
  const updateProfile = async (data: ProfileFormData): Promise<{ success: boolean; error: Error | null }> => {
    if (!user) {
      return { success: false, error: new Error("User not authenticated") }
    }

    try {
      debugLog("Updating profile for user", user.id, data)

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
        debugLog("Error updating profile:", responseData.error)
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
        // Update cache
        setCacheItem(CACHE_KEYS.PROFILE(user.id), updatedProfile)
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Error updating profile:", error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  const signIn = async (credentials: { email: string; password: string }) => {
    debugLog("Sign in attempt", { email: credentials.email })
    try {
      // Strictly validate email and password as strings
      const validation = validateAuthCredentials(credentials.email, credentials.password)

      if (!validation.valid) {
        debugLog("Invalid credentials format", validation.errors)
        return {
          error: new Error("Invalid credentials format"),
          fieldErrors: validation.errors,
        }
      }

      // Sanitize email
      const sanitizedEmail = sanitizeEmail(credentials.email)
      if (!sanitizedEmail) {
        debugLog("Email sanitization failed")
        return {
          error: new Error("Invalid email format"),
          fieldErrors: { email: "Invalid email format" },
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: credentials.password,
      })

      if (error) {
        debugLog("Sign-in error from Supabase", error)
        return { error: new Error(error.message) }
      }

      // Explicitly update the state with the new session data
      if (data?.session) {
        debugLog("Sign-in successful, updating session and user")
        setSession(data.session)
        setUser(data.user)

        // Fetch and update the profile as well
        if (data.user) {
          const { profile: fetchedProfile } = await fetchProfileSafely(data.user.id)
          if (fetchedProfile) {
            debugLog("Profile fetched after sign-in")
            setProfile(fetchedProfile)
            // Cache the profile
            setCacheItem(CACHE_KEYS.PROFILE(data.user.id), fetchedProfile)
          }
        }
      }

      return { error: null }
    } catch (error: any) {
      console.error("Sign in error:", error)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const signUp = async (credentials: { email: string; password: string }) => {
    debugLog("Sign up attempt", { email: credentials.email })
    try {
      // Strictly validate email and password as strings
      const validation = validateAuthCredentials(credentials.email, credentials.password)

      if (!validation.valid) {
        debugLog("Invalid credentials format", validation.errors)
        return {
          error: new Error("Invalid credentials format"),
          fieldErrors: validation.errors,
        }
      }

      // Sanitize email
      const sanitizedEmail = sanitizeEmail(credentials.email)
      if (!sanitizedEmail) {
        debugLog("Email sanitization failed")
        return {
          error: new Error("Invalid email format"),
          fieldErrors: { email: "Invalid email format" },
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        debugLog("Sign-up error from Supabase", error)
        return { error: new Error(error.message) }
      }

      // Explicitly update the state with the new session data if available
      // Note: For sign-up with email confirmation, there might not be a session yet
      if (data?.user) {
        debugLog("Sign-up successful, confirmation required")
        // User created but confirmation required, no session yet
      }

      // Explicitly indicate that an email verification was sent
      return { error: null, emailVerificationSent: true }
    } catch (error: any) {
      console.error("Sign up error:", error)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const signOut = async () => {
    debugLog("Sign out attempt")
    try {
      await supabase.auth.signOut()

      // Explicitly clear state
      setUser(null)
      setProfile(null)
      setSession(null)

      // Reset the client to ensure a clean state
      resetSupabaseClient()

      // Redirect to sign-in page
      router.push("/auth/sign-in")

      debugLog("Sign out successful")
    } catch (error) {
      console.error("Sign out error:", error)
      // Even if there's an error, clear the local state
      setUser(null)
      setProfile(null)
      setSession(null)
      router.push("/auth/sign-in")
    }
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error("Reset password error:", error)
      return { success: false, error: error.message || "Failed to reset password" }
    }
  }

  const updatePassword = async (password: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error("Update password error:", error)
      return { success: false, error: error.message || "Failed to update password" }
    }
  }

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!user) {
      debugLog("Cannot refresh profile: no user")
      return null
    }

    try {
      debugLog("Refreshing profile for user", user.id)
      setIsLoading(true)

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      if (data) {
        debugLog("Profile refreshed successfully")
        setProfile(data)
        // Cache the refreshed profile
        setCacheItem(CACHE_KEYS.PROFILE(user.id), data)
        return data
      }

      return null
    } catch (error) {
      console.error("Unexpected error refreshing profile:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getClientInfo = () => {
    return {
      hasClient: true,
      isInitializing: false,
      hasInitPromise: false,
      clientInstanceCount: 1,
      goTrueClientCount: 1,
      clientInitTime: Date.now(),
      lastResetTime: Date.now(),
      storageKeys:
        typeof window !== "undefined"
          ? Object.keys(localStorage).filter((key) => key.includes("supabase") || key.includes("auth"))
          : [],
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
    getClientInfo,
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
