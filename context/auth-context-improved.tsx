"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import type { UserProfile, ProfileFormData } from "@/types/auth"
import { getCacheItem, setCacheItem, CACHE_KEYS, CACHE_EXPIRY } from "@/lib/cache-utils"
import { getSupabaseClient, resetSupabaseClient } from "@/lib/supabase-client-unified"
import { useToast } from "@/hooks/use-toast"

// Debug mode
const DEBUG_MODE = process.env.NODE_ENV === "development"

// Debug logging
function debugLog(...args: any[]): void {
  if (DEBUG_MODE) {
    console.log("[Auth Context]", ...args)
  }
}

// Auth context type
interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isLoadingProfile: boolean
  isSigningIn: boolean
  isSigningUp: boolean
  isSigningOut: boolean
  signIn: (credentials: {
    email: string
    password: string
  }) => Promise<{
    success: boolean
    error: Error | null
    needsEmailVerification?: boolean
  }>
  signUp: (credentials: {
    email: string
    password: string
  }) => Promise<{
    success: boolean
    error: Error | null
    emailVerificationSent?: boolean
  }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<UserProfile | null>
  refreshSession: () => Promise<Session | null>
  updateProfile: (data: ProfileFormData) => Promise<{
    success: boolean
    error: Error | null
    profile?: UserProfile
  }>
  getUser: () => Promise<User | null>
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const isMounted = useRef(true)
  const isInitialized = useRef(false)
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null)

  // Initialize auth state
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializeAuth = async () => {
      try {
        debugLog("Initializing auth state")
        setIsLoading(true)

        // Get the Supabase client from our singleton
        const supabase = getSupabaseClient({
          debugMode: DEBUG_MODE,
        })

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
            // Fetch profile data from database
            await fetchUserProfile(initialSession.user.id)
          }
        } else {
          debugLog("User is not authenticated")
          setIsLoading(false)
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(handleAuthStateChange)

        // Store the subscription for cleanup
        authSubscription.current = subscription
      } catch (error) {
        console.error("Error initializing auth:", error)
        setIsLoading(false)

        toast({
          title: "Authentication Error",
          description: "There was a problem initializing your session. Please refresh the page.",
          variant: "destructive",
        })
      }
    }

    initializeAuth()

    return () => {
      isMounted.current = false
      // Clean up subscription if it exists
      if (authSubscription.current) {
        authSubscription.current.unsubscribe()
      }
    }
  }, [router, toast])

  // Handle auth state changes
  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
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

      // Fetch profile data
      await fetchUserProfile(newSession.user.id)
    } else if (event === "TOKEN_REFRESHED" && newSession) {
      debugLog("Token refreshed, updating session")
      setSession(newSession)
    } else if (event === "USER_UPDATED" && newSession?.user) {
      debugLog("User updated, updating user and session")
      setSession(newSession)
      setUser(newSession.user)
    }

    // Refresh the page to update server components
    router.refresh()
  }

  // Fetch user profile
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null

    setIsLoadingProfile(true)

    try {
      debugLog("Fetching profile for user", userId)

      const supabase = getSupabaseClient()

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)

        // If the profile doesn't exist, try to create it
        if (error.code === "PGRST116") {
          debugLog("Profile not found, attempting to create one")
          return await createUserProfile(userId)
        }

        return null
      }

      debugLog("Profile fetched successfully")
      setProfile(data as UserProfile)

      // Cache the profile
      setCacheItem(CACHE_KEYS.PROFILE(userId), data as UserProfile, CACHE_EXPIRY.PROFILE)

      return data as UserProfile
    } catch (error) {
      console.error("Unexpected error fetching profile:", error)
      return null
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Create user profile
  const createUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      debugLog("Creating profile for user", userId)

      const supabase = getSupabaseClient()

      // Get user email first
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        debugLog("No user found when creating profile")
        return null
      }

      // Create minimal profile with just the ID and email
      const newProfile = {
        id: userId,
        email: user.email || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("profiles").insert(newProfile).select().single()

      if (error) {
        console.error("Error creating profile:", error)
        return null
      }

      debugLog("Profile created successfully")
      setProfile(data as UserProfile)

      // Cache the profile
      setCacheItem(CACHE_KEYS.PROFILE(userId), data as UserProfile, CACHE_EXPIRY.PROFILE)

      return data as UserProfile
    } catch (error) {
      console.error("Error creating profile:", error)
      return null
    }
  }

  // Sign in
  const signIn = async (credentials: { email: string; password: string }): Promise<{
    success: boolean
    error: Error | null
    needsEmailVerification?: boolean
  }> => {
    debugLog("Sign in attempt", { email: credentials.email })
    setIsSigningIn(true)

    try {
      // Validate inputs
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: new Error("Email and password are required"),
        }
      }

      // Normalize email
      const email = credentials.email.trim().toLowerCase()

      // Get the Supabase client
      const supabase = getSupabaseClient()

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      })

      if (error) {
        debugLog("Sign-in error:", error.message)

        // Check for email verification errors
        if (error.message.includes("Email not confirmed") || error.message.includes("verify your email")) {
          return {
            success: false,
            error: new Error(error.message),
            needsEmailVerification: true,
          }
        }

        return { success: false, error: new Error(error.message) }
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: new Error("Sign in failed: No user or session returned"),
        }
      }

      // Update state
      setUser(data.user)
      setSession(data.session)

      // Fetch profile
      await fetchUserProfile(data.user.id)

      debugLog("Sign in successful")
      return { success: true, error: null }
    } catch (error: any) {
      console.error("Unexpected sign in error:", error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  // Sign up
  const signUp = async (credentials: { email: string; password: string }): Promise<{
    success: boolean
    error: Error | null
    emailVerificationSent?: boolean
  }> => {
    debugLog("Sign up attempt", { email: credentials.email })
    setIsSigningUp(true)

    try {
      // Validate inputs
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: new Error("Email and password are required"),
        }
      }

      // Validate password strength
      if (credentials.password.length < 8) {
        return {
          success: false,
          error: new Error("Password must be at least 8 characters long"),
        }
      }

      // Normalize email
      const email = credentials.email.trim().toLowerCase()

      // Get the Supabase client
      const supabase = getSupabaseClient()

      // Get site URL for redirect
      const siteUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

      // Attempt to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: {
            signup_timestamp: new Date().toISOString(),
          },
        },
      })

      if (error) {
        debugLog("Sign-up error:", error.message)
        return { success: false, error: new Error(error.message) }
      }

      // If user is created but email confirmation is needed
      if (data.user && !data.session) {
        debugLog("Sign up successful, email verification required")
        return {
          success: true,
          error: null,
          emailVerificationSent: true,
        }
      }

      // User created and automatically signed in (no email verification required)
      if (data.user && data.session) {
        debugLog("Sign up successful with immediate session")

        // Update state
        setUser(data.user)
        setSession(data.session)

        // Create profile
        await createUserProfile(data.user.id)

        return { success: true, error: null }
      }

      return {
        success: false,
        error: new Error("Sign up failed: Unexpected response"),
      }
    } catch (error: any) {
      console.error("Unexpected sign up error:", error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    } finally {
      setIsSigningUp(false)
    }
  }

  // Sign out
  const signOut = async (): Promise<void> => {
    debugLog("Sign out attempt")
    setIsSigningOut(true)

    try {
      // Get the Supabase client
      const supabase = getSupabaseClient()

      await supabase.auth.signOut()

      // Clear state
      setUser(null)
      setProfile(null)
      setSession(null)

      // Reset the client to ensure a clean state
      resetSupabaseClient()

      debugLog("Sign out successful")

      // Redirect to sign-in page
      router.push("/auth/sign-in")
    } catch (error) {
      console.error("Sign out error:", error)

      // Even if there's an error, clear the local state
      setUser(null)
      setProfile(null)
      setSession(null)

      toast({
        title: "Sign Out Error",
        description: "There was a problem signing out. The application has been reset.",
        variant: "destructive",
      })

      router.push("/auth/sign-in")
    } finally {
      setIsSigningOut(false)
    }
  }

  // Update profile
  const updateProfile = async (
    data: ProfileFormData,
  ): Promise<{
    success: boolean
    error: Error | null
    profile?: UserProfile
  }> => {
    if (!user) {
      return { success: false, error: new Error("User not authenticated") }
    }

    try {
      debugLog("Updating profile for user", user.id)

      const supabase = getSupabaseClient()

      // Current timestamp
      const now = new Date().toISOString()

      // Prepare update data
      const updateData = {
        ...data,
        updated_at: now,
      }

      // Update profile in database
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating profile:", error)
        return { success: false, error: new Error(error.message) }
      }

      // Update local state with the new profile
      const newProfile = updatedProfile as UserProfile
      setProfile(newProfile)

      // Update cache
      setCacheItem(CACHE_KEYS.PROFILE(user.id), newProfile, CACHE_EXPIRY.PROFILE)

      debugLog("Profile updated successfully")
      return { success: true, error: null, profile: newProfile }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  // Refresh profile
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) {
      debugLog("Cannot refresh profile: no user")
      return null
    }

    return await fetchUserProfile(user.id)
  }, [user])

  // Refresh session
  const refreshSession = useCallback(async (): Promise<Session | null> => {
    try {
      debugLog("Refreshing session")

      const supabase = getSupabaseClient()

      const {
        data: { session: refreshedSession },
      } = await supabase.auth.getSession()

      if (refreshedSession) {
        setSession(refreshedSession)
        setUser(refreshedSession.user)
      }

      return refreshedSession
    } catch (error) {
      console.error("Error refreshing session:", error)
      return null
    }
  }, [])

  // Get current user
  const getUser = useCallback(async (): Promise<User | null> => {
    try {
      const supabase = getSupabaseClient()

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (currentUser && (!user || user.id !== currentUser.id)) {
        setUser(currentUser)
      }

      return currentUser
    } catch (error) {
      console.error("Error getting user:", error)
      return null
    }
  }, [user])

  // Context value
  const value = {
    user,
    profile,
    session,
    isLoading,
    isLoadingProfile,
    isSigningIn,
    isSigningUp,
    isSigningOut,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    refreshSession,
    updateProfile,
    getUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
