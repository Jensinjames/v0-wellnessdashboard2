"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import type { UserProfile, ProfileFormData } from "@/types/auth"
import { fetchProfileSafely, createProfileSafely } from "@/utils/profile-utils"
import { getCacheItem, setCacheItem, CACHE_KEYS } from "@/lib/cache-utils"
import { validateAuthCredentials, sanitizeEmail } from "@/utils/auth-validation"
import { resetTokenManager } from "@/lib/token-manager"
import { resetSupabaseClient, cleanupOrphanedClients } from "@/lib/supabase-client"
import { isDebugMode } from "@/lib/env-utils"
import { handleAuthError } from "@/utils/auth-error-handler"

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
  getClientInfo: () => any
  refreshSession: () => Promise<boolean>
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default debug mode to false
const DEFAULT_AUTH_DEBUG_MODE = false

// Enable/disable debug logging
export function setAuthDebugMode(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_debug", enabled ? "true" : "false")
  }
  console.log(`Auth debug mode ${enabled ? "enabled" : "disabled"}`)
}

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (isDebugMode()) {
    console.log("[Auth Context]", ...args)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const isMounted = useRef(true)
  const isInitialized = useRef(false)
  const lastTokenRefresh = useRef<number>(0)
  const refreshInProgress = useRef<boolean>(false)
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)

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
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setIsLoading(false)
          return
        }

        if (initialSession?.user) {
          debugLog("User is authenticated, setting session and user")
          setSession(initialSession)
          setUser(initialSession.user)
          lastTokenRefresh.current = Date.now()

          // Check cache first for profile data
          const cachedProfile = getCacheItem<UserProfile>(CACHE_KEYS.PROFILE(initialSession.user.id))

          if (cachedProfile) {
            debugLog("Using cached profile data")
            setProfile(cachedProfile)
            setIsLoading(false)

            // Still fetch profile in background to ensure it's up to date
            fetchProfileSafely(initialSession.user.id)
              .then(({ profile: fetchedProfile }) => {
                if (fetchedProfile && isMounted.current) {
                  setProfile(fetchedProfile)
                  setCacheItem(CACHE_KEYS.PROFILE(initialSession.user.id), fetchedProfile)
                }
              })
              .catch((err) => {
                console.error("Background profile fetch error:", err)
              })
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
            // Reset token manager to clear any scheduled refreshes
            resetTokenManager()
            // Reset the client to ensure a clean state
            resetSupabaseClient()

            // Clear any session check interval
            if (sessionCheckInterval.current) {
              clearInterval(sessionCheckInterval.current)
              sessionCheckInterval.current = null
            }
          } else if (event === "SIGNED_IN" && newSession?.user) {
            debugLog("User signed in, updating state")
            setSession(newSession)
            setUser(newSession.user)
            lastTokenRefresh.current = Date.now()

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

            // Set up session check interval
            setupSessionCheck()
          } else if (event === "TOKEN_REFRESHED" && newSession) {
            debugLog("Token refreshed, updating session")
            setSession(newSession)
            lastTokenRefresh.current = Date.now()
          } else if (event === "USER_UPDATED" && newSession) {
            debugLog("User updated, updating session and user")
            setSession(newSession)
            setUser(newSession.user)
          }

          // Refresh the page to update server components
          router.refresh()
        })

        // Set up session check interval if user is authenticated
        if (initialSession?.user) {
          setupSessionCheck()
        }

        return () => {
          debugLog("Cleaning up auth state change listener")
          subscription.unsubscribe()

          if (sessionCheckInterval.current) {
            clearInterval(sessionCheckInterval.current)
            sessionCheckInterval.current = null
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()

    return () => {
      isMounted.current = false

      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
        sessionCheckInterval.current = null
      }
    }
  }, [supabase, router])

  // Set up periodic session check
  const setupSessionCheck = useCallback(() => {
    // Clear any existing interval
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current)
    }

    // Check session every 5 minutes
    sessionCheckInterval.current = setInterval(() => {
      if (session) {
        // Check if token is about to expire (within 10 minutes)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        if (timeUntilExpiry < 600000) {
          // Less than 10 minutes
          debugLog("Session about to expire, refreshing")
          refreshSession().catch((err) => {
            console.error("Error refreshing session:", err)
          })
        }
      }
    }, 300000) // 5 minutes
  }, [session])

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up orphaned clients when the auth provider unmounts
      cleanupOrphanedClients(true)

      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
        sessionCheckInterval.current = null
      }
    }
  }, [])

  // Update profile function
  const updateProfile = async (data: ProfileFormData): Promise<{ success: boolean; error: Error | null }> => {
    if (!user) {
      return { success: false, error: new Error("User not authenticated") }
    }

    try {
      debugLog("Updating profile for user", user.id, data)

      // Direct database update approach
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update({
          // Map the ProfileFormData to the actual database column names
          first_name: data.first_name,
          last_name: data.last_name,
          full_name: `${data.first_name} ${data.last_name}`, // If your DB uses full_name
          display_name: data.first_name, // If your DB uses display_name
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        debugLog("Error updating profile:", error)
        return {
          success: false,
          error: new Error(error.message || "Failed to update profile"),
        }
      }

      // Update local profile state with the new data
      if (updatedProfile) {
        const mergedProfile = {
          ...profile,
          ...updatedProfile,
          // Ensure our client-side model has the expected properties
          first_name: data.first_name,
          last_name: data.last_name,
        } as UserProfile

        setProfile(mergedProfile)
        // Update cache
        setCacheItem(CACHE_KEYS.PROFILE(user.id), mergedProfile)
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

      if (sanitizedEmail === "demo@example.com" && credentials.password === "demo123") {
        debugLog("Using mock sign-in for demo user")
        // Mock sign-in for demo user
        const mockUserId = "mock-" + Math.random().toString(36).substring(2, 15)

        setUser({
          id: mockUserId,
          email: "demo@example.com",
          aud: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          role: "authenticated",
          updated_at: new Date().toISOString(),
        })

        const mockProfile = {
          id: mockUserId,
          email: "demo@example.com",
          first_name: "Demo",
          last_name: "User",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserProfile

        setProfile(mockProfile)

        const mockSession = {
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: mockUserId,
            email: "demo@example.com",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          },
        } as Session

        setSession(mockSession)
        lastTokenRefresh.current = Date.now()

        // Cache the mock profile
        setCacheItem(CACHE_KEYS.PROFILE(mockUserId), mockProfile)

        // Set up session check interval
        setupSessionCheck()

        return { error: null, mockSignIn: true }
      } else {
        debugLog("Attempting real sign-in with Supabase")

        // Clear any existing session first to prevent conflicts
        try {
          await supabase.auth.signOut({ scope: "local" })
        } catch (signOutError) {
          // Ignore errors during sign-out, just log them
          console.warn("Error during pre-sign-in cleanup:", signOutError)
        }

        // Use a properly structured object for signInWithPassword
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: credentials.password,
        })

        if (error) {
          debugLog("Sign-in error from Supabase", error)

          // Check if the error is due to email not being verified
          if (error.message?.includes("Email not confirmed")) {
            return {
              error: new Error("Please verify your email before signing in. Check your inbox for a verification link."),
              mockSignIn: false,
            }
          }

          if (error.message?.includes("Network request failed")) {
            return {
              error: new Error(error.message),
              mockSignIn: false,
              networkIssue: true,
            }
          }

          // Check for database errors
          if (
            error.message?.includes("Database error") ||
            error.message?.includes("database error") ||
            error.message?.includes("db error")
          ) {
            // For database errors, suggest using demo mode
            return {
              error: new Error("Database error granting user. Please try again or use demo mode."),
              mockSignIn: false,
            }
          }

          return { error: new Error(error.message), mockSignIn: false }
        }

        // Explicitly update the state with the new session data
        if (data?.session) {
          debugLog("Sign-in successful, updating session and user")
          setSession(data.session)
          setUser(data.user)
          lastTokenRefresh.current = Date.now()

          // Set up session check interval
          setupSessionCheck()

          try {
            // Fetch and update the profile as well
            if (data.user) {
              const { profile: fetchedProfile, error: profileError } = await fetchProfileSafely(data.user.id)

              if (profileError) {
                debugLog("Error fetching profile after sign-in:", profileError)
                // Don't fail the sign-in if profile fetch fails
                // We'll try to create a profile instead
                if (data.user.email) {
                  try {
                    const { profile: createdProfile } = await createProfileSafely(data.user.id, data.user.email)
                    if (createdProfile) {
                      setProfile(createdProfile)
                      setCacheItem(CACHE_KEYS.PROFILE(data.user.id), createdProfile)
                    }
                  } catch (createError) {
                    console.error("Error creating profile after sign-in:", createError)
                    // Still don't fail the sign-in
                  }
                }
              } else if (fetchedProfile) {
                debugLog("Profile fetched after sign-in")
                setProfile(fetchedProfile)
                // Cache the profile
                setCacheItem(CACHE_KEYS.PROFILE(data.user.id), fetchedProfile)
              }
            }
          } catch (profileError) {
            // Log but don't fail the sign-in if profile operations fail
            console.error("Error during profile operations after sign-in:", profileError)
          }
        }

        return { error: null, mockSignIn: false }
      }
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

      if (sanitizedEmail === "demo@example.com") {
        debugLog("Using mock sign-up for demo user")
        // Mock sign-up for demo user
        const mockUserId = "mock-" + Math.random().toString(36).substring(2, 15)

        setUser({
          id: mockUserId,
          email: "demo@example.com",
          aud: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          role: "authenticated",
          updated_at: new Date().toISOString(),
        })

        const mockProfile = {
          id: mockUserId,
          email: "demo@example.com",
          first_name: "Demo",
          last_name: "User",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserProfile

        setProfile(mockProfile)

        const mockSession = {
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: mockUserId,
            email: "demo@example.com",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          },
        } as Session

        setSession(mockSession)
        lastTokenRefresh.current = Date.now()

        // Cache the mock profile
        setCacheItem(CACHE_KEYS.PROFILE(mockUserId), mockProfile)

        // Set up session check interval
        setupSessionCheck()

        return { error: null, mockSignUp: true }
      } else {
        debugLog("Attempting real sign-up with Supabase")

        // Get the current origin for the redirect URL
        const origin = typeof window !== "undefined" ? window.location.origin : ""
        const redirectUrl = `${origin}/auth/callback`

        debugLog(`Using redirect URL: ${redirectUrl}`)

        // Use a properly structured object for signUp
        const { data, error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password: credentials.password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })

        if (error) {
          debugLog("Sign-up error from Supabase", error)
          if (error.message?.includes("Network request failed")) {
            return {
              error: new Error(error.message),
              mockSignUp: false,
              networkIssue: true,
            }
          }
          return { error: new Error(error.message), mockSignUp: false }
        }

        // Check if confirmation is required
        const emailVerificationRequired = !data.session

        if (emailVerificationRequired) {
          debugLog("Sign-up successful, email verification required")
          return {
            error: null,
            mockSignUp: false,
            emailVerificationSent: true,
          }
        }

        // Explicitly update the state with the new session data if available
        if (data?.session) {
          debugLog("Sign-up successful with immediate session, updating state")
          setSession(data.session)
          setUser(data.user)
          lastTokenRefresh.current = Date.now()

          // Set up session check interval
          setupSessionCheck()

          // Create a profile for the new user
          if (data.user && data.user.email) {
            debugLog("Creating profile for new user")
            const { profile: createdProfile } = await createProfileSafely(data.user.id, data.user.email)
            if (createdProfile) {
              debugLog("Profile created after sign-up")
              setProfile(createdProfile)
              // Cache the profile
              setCacheItem(CACHE_KEYS.PROFILE(data.user.id), createdProfile)
            }
          }
        }

        return { error: null, mockSignUp: false }
      }
    } catch (error: any) {
      console.error("Sign up error:", error)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const signOut = async () => {
    debugLog("Sign out attempt")
    try {
      // Clear any session check interval
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
        sessionCheckInterval.current = null
      }

      await supabase.auth.signOut()

      // Explicitly clear state
      setUser(null)
      setProfile(null)
      setSession(null)

      // Reset token manager to clear any scheduled refreshes
      resetTokenManager()

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

  const refreshProfile = useCallback(async () => {
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
  }, [user, supabase])

  // New function to proactively refresh the auth session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refreshes
    if (refreshInProgress.current) {
      debugLog("Session refresh already in progress")
      return false
    }

    if (!session) {
      debugLog("Cannot refresh session: not signed in")
      return false
    }

    // Throttle refresh attempts (no more than once every 30 seconds)
    const timeSinceLastRefresh = Date.now() - lastTokenRefresh.current
    if (timeSinceLastRefresh < 30000) {
      debugLog(`Skipping refresh, last refresh was ${Math.floor(timeSinceLastRefresh / 1000)}s ago`)
      return true // Return true because we're still within a valid window
    }

    try {
      refreshInProgress.current = true
      debugLog("Manually refreshing session")

      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("Error refreshing session:", error)
        return false
      }

      if (data.session) {
        debugLog("Session refreshed successfully")
        setSession(data.session)
        lastTokenRefresh.current = Date.now()
        return true
      } else {
        debugLog("Session refresh returned no session")
        return false
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error)
      return false
    } finally {
      refreshInProgress.current = false
    }
  }, [session, supabase])

  // Function to resend verification email
  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error: Error | null }> => {
    if (!email) {
      return { success: false, error: new Error("Email is required") }
    }

    try {
      debugLog("Resending verification email to", email)

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        debugLog("Error resending verification email:", error)
        return {
          success: false,
          error: new Error(handleAuthError(error, "email-verification")),
        }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Unexpected error resending verification email:", error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
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
      lastTokenRefresh: lastTokenRefresh.current,
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
    getClientInfo,
    refreshSession,
    resendVerificationEmail,
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
