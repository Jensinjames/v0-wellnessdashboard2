"\"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

// Define types for auth credentials and user profile
export interface SignUpCredentials {
  email: string
  password: string
  full_name?: string
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface PasswordUpdateData {
  current_password: string
  new_password: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

// Define the auth context type
interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signUp: (credentials: SignUpCredentials) => Promise<{ error: any | null; data: any | null }>
  signIn: (credentials: SignInCredentials) => Promise<{ error: any | null; data: any | null }>
  signOut: () => Promise<void>
  updatePassword: (data: PasswordUpdateData) => Promise<{ error: any | null }>
  resetPassword: (email: string) => Promise<{ error: any | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component that manages authentication state and provides
 * authentication-related functionality to its children.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  // Use refs to prevent infinite loops and track fetch attempts
  const fetchingProfile = useRef<Record<string, boolean>>({})
  const profileFetchAttempts = useRef<Record<string, number>>({})
  const MAX_FETCH_ATTEMPTS = 3

  /**
   * Fetches a user's profile from the database or creates one if it doesn't exist.
   * Includes safeguards against infinite loops and concurrent fetches.
   */
  const fetchProfile = async (userId: string) => {
    // Prevent concurrent fetches for the same user
    if (fetchingProfile.current[userId]) {
      return null
    }

    // Check if we've exceeded max attempts
    if ((profileFetchAttempts.current[userId] || 0) >= MAX_FETCH_ATTEMPTS) {
      console.error(`Maximum profile fetch attempts reached for user ${userId}`)
      return null
    }

    try {
      // Set fetching flag
      fetchingProfile.current[userId] = true

      // Increment attempt counter
      profileFetchAttempts.current[userId] = (profileFetchAttempts.current[userId] || 0) + 1

      // First check if the profile exists
      const { data, error, count } = await supabase.from("profiles").select("*", { count: "exact" }).eq("id", userId)

      // If no profile exists, create one
      if (count === 0 || error) {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user

        if (user) {
          const newProfile = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { data: createdProfile, error: createError } = await supabase
            .from("profiles")
            .insert([newProfile])
            .select()
            .single()

          if (createError) {
            console.error("Error creating profile:", createError)
            fetchingProfile.current[userId] = false
            return null
          }

          // Reset attempt counter on success
          profileFetchAttempts.current[userId] = 0
          fetchingProfile.current[userId] = false

          return createdProfile as UserProfile
        }

        fetchingProfile.current[userId] = false
        return null
      }

      // If multiple profiles exist (shouldn't happen, but just in case)
      if (count > 1) {
        console.warn(`Multiple profiles found for user ${userId}. Using the first one.`)
      }

      // Reset attempt counter on success
      profileFetchAttempts.current[userId] = 0
      fetchingProfile.current[userId] = false

      return data[0] as UserProfile
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      fetchingProfile.current[userId] = false
      return null
    }
  }

  /**
   * Refreshes the user's profile data.
   * Used when profile information might have changed.
   */
  const refreshProfile = async () => {
    if (!user) return

    const profile = await fetchProfile(user.id)
    if (profile) {
      setProfile(profile)
    }
  }

  // Initialize auth state and set up listener
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setIsLoading(false)
          return
        }

        setSession(session)

        if (session?.user) {
          setUser(session.user)
          const profile = await fetchProfile(session.user.id)
          setProfile(profile)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setProfile(profile)
      } else {
        setProfile(null)
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh()
      }
    })

    initializeAuth()

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  /**
   * Signs up a new user with email, password, and optional full name.
   * Displays appropriate toast notifications for success or failure.
   */
  const signUp = async (credentials: SignUpCredentials) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name || "",
          },
        },
      })

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        })
        return { error, data: null }
      }

      toast({
        title: "Sign up successful",
        description: "Please check your email to verify your account.",
      })
      return { error: null, data }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
      return { error, data: null }
    }
  }

  /**
   * Signs in a user with email and password.
   * Ensures a profile exists for the user and displays appropriate toast notifications.
   */
  const signIn = async (credentials: SignInCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        })
        return { error, data: null }
      }

      if (data.user) {
        // Ensure profile exists
        const profile = await fetchProfile(data.user.id)
        setProfile(profile)
      }

      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      })
      return { error: null, data }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
      return { error, data: null }
    }
  }

  /**
   * Signs out the current user and redirects to the sign-in page.
   * Displays appropriate toast notifications for success or failure.
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      router.push("/auth/sign-in")
      toast({
        title: "Sign out successful",
        description: "You have been successfully signed out.",
      })
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  /**
   * Updates the user's password after verifying the current password.
   * Displays appropriate toast notifications for success or failure.
   */
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First verify the current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      })

      if (verifyError) {
        toast({
          title: "Password update failed",
          description: "Current password is incorrect",
          variant: "destructive",
        })
        return { error: { message: "Current password is incorrect" } }
      }

      // Then update to the new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      })
      return { error: null }
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
      return { error }
    }
  }

  /**
   * Sends a password reset email to the specified email address.
   * Displays appropriate toast notifications for success or failure.
   */
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password.",
      })
      return { error: null }
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
      return { error }
    }
  }

  // Provide auth context value
  const value = {
    user,
    profile,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    updatePassword,
    resetPassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use the auth context.
 * Must be used within an AuthProvider component.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
