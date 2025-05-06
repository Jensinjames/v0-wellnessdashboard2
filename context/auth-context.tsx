"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import type { UserProfile } from "@/types/auth"
import { fetchProfileSafely, createProfileSafely } from "@/utils/profile-utils"
import { getCacheItem, CACHE_KEYS } from "@/lib/cache-utils"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null; mockSignIn?: boolean }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; mockSignUp?: boolean; networkIssue?: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
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
  const supabase = createClientComponentClient()
  const isMounted = useRef(true)
  const isInitialized = useRef(false)

  // Initialize auth state
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializeAuth = async () => {
      try {
        // Get session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()
        setSession(initialSession)

        if (initialSession?.user) {
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
                const { profile: fetchedProfile, error } = await fetchProfileSafely(initialSession.user.id)

                if (error) {
                  console.error("Error fetching profile:", error)

                  // If no profile found, try to create one
                  if (initialSession.user.email) {
                    const { profile: createdProfile, error: createError } = await createProfileSafely(
                      initialSession.user.id,
                      initialSession.user.email,
                    )

                    if (createError) {
                      console.error("Error creating profile:", createError)
                    } else if (createdProfile) {
                      setProfile(createdProfile)
                    }
                  }
                } else if (fetchedProfile) {
                  setProfile(fetchedProfile)
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
          setIsLoading(false)
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
          debugLog("Auth state change:", event)
          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (event === "SIGNED_OUT") {
            setProfile(null)
          } else if (event === "SIGNED_IN" && newSession?.user) {
            // Fetch profile on sign in
            fetchProfileSafely(newSession.user.id).then(({ profile, error }) => {
              if (error) {
                console.error("Error fetching profile after sign in:", error)
              } else if (profile) {
                setProfile(profile)
              }
            })
          }

          router.refresh()
        })

        return () => {
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

  const signIn = async (email: string, password: string) => {
    try {
      // Fix: Ensure email and password are strings and properly formatted
      if (typeof email !== "string" || typeof password !== "string") {
        return {
          error: new Error("Email and password must be strings"),
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return {
          error: new Error("Invalid email format"),
        }
      }

      if (email === "demo@example.com" && password === "demo123") {
        // Mock sign-in for demo user
        setUser({
          id: "mock-" + Math.random().toString(36).substring(2, 15),
          email: "demo@example.com",
          aud: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          role: "authenticated",
          updated_at: new Date().toISOString(),
        })
        setProfile({
          id: "mock-" + Math.random().toString(36).substring(2, 15),
          email: "demo@example.com",
          first_name: "Demo",
          last_name: "User",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserProfile)
        setSession({
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: "mock-" + Math.random().toString(36).substring(2, 15),
            email: "demo@example.com",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          },
        } as Session)
        return { error: null, mockSignIn: true }
      } else {
        // Fix: Use a properly structured object for signInWithPassword
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error?.message?.includes("Network request failed")) {
          return { error: error ? new Error(error.message) : null, mockSignIn: false, networkIssue: true }
        }

        return { error: error ? new Error(error.message) : null, mockSignIn: false }
      }
    } catch (error: any) {
      console.error("Sign in error:", error)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      // Fix: Ensure email and password are strings and properly formatted
      if (typeof email !== "string" || typeof password !== "string") {
        return {
          error: new Error("Email and password must be strings"),
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return {
          error: new Error("Invalid email format"),
        }
      }

      if (email === "demo@example.com") {
        // Mock sign-up for demo user
        setUser({
          id: "mock-" + Math.random().toString(36).substring(2, 15),
          email: "demo@example.com",
          aud: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          role: "authenticated",
          updated_at: new Date().toISOString(),
        })
        setProfile({
          id: "mock-" + Math.random().toString(36).substring(2, 15),
          email: "demo@example.com",
          first_name: "Demo",
          last_name: "User",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserProfile)
        setSession({
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: "mock-" + Math.random().toString(36).substring(2, 15),
            email: "demo@example.com",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          },
        } as Session)
        return { error: null, mockSignUp: true }
      } else {
        // Fix: Use a properly structured object for signUp
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error?.message?.includes("Network request failed")) {
          return { error: error ? new Error(error.message) : null, mockSignUp: false, networkIssue: true }
        }

        return { error: error ? new Error(error.message) : null, mockSignUp: false }
      }
    } catch (error: any) {
      console.error("Sign up error:", error)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/sign-in")
  }

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return { error: new Error("Not authenticated") }

    try {
      const { error } = await supabase.from("profiles").update(profileData).eq("id", user.id)

      if (error) {
        return { error: new Error(error.message) }
      }

      // Refresh the profile
      await refreshProfile()

      return { error: null }
    } catch (error: any) {
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const { profile: refreshedProfile, error } = await fetchProfileSafely(user.id)

      if (error) {
        console.error("Error refreshing profile:", error)
      } else if (refreshedProfile) {
        setProfile(refreshedProfile)
      }
    } catch (error) {
      console.error("Unexpected error refreshing profile:", error)
    }
  }

  const getClientInfo = () => {
    return {
      hasClient: true,
      isInitializing: false,
      hasInitPromise: false,
      clientInstanceCount: 1,
      goTrueClientCount: 1,
      clientInitTime: 1234567890,
      lastResetTime: 1234567890,
      storageKeys: [],
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
