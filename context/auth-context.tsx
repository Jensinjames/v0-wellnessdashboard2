"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { logDatabaseError, safeDbOperation } from "@/utils/db-error-handler"
import { validateUserData } from "@/utils/validation"

// Define types for auth credentials and user profile
export interface SignUpCredentials {
  email: string
  password: string
  full_name?: string
  persistSession?: boolean
}

export interface SignInCredentials {
  email: string
  password: string
  persistSession?: boolean
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
  signOut: (redirectTo?: string) => Promise<void>
  updatePassword: (data: PasswordUpdateData) => Promise<{ error: any | null }>
  resetPassword: (email: string) => Promise<{ error: any | null }>
  refreshProfile: () => Promise<void>
  ensureProfile: (userId: string) => Promise<UserProfile | null>
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
   * Ensures a user profile exists in the database.
   * If no profile exists, creates one.
   */
  const ensureProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log(`Ensuring profile exists for user: ${userId}`)

      // First check if the profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      // If profile exists, return it
      if (!checkError && existingProfile) {
        console.log("Profile already exists:", existingProfile)
        return existingProfile as UserProfile
      }

      // If error is not about missing data, log it
      if (checkError && !checkError.message.includes("No rows found")) {
        logDatabaseError(checkError, "checking profile existence", { userId })
        return null
      }

      console.log(`No profile found for user ${userId}, creating one...`)

      // Get user details to create profile
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        logDatabaseError(userError || new Error("No user found"), "getting user for profile creation", { userId })
        return null
      }

      const user = userData.user

      // Create new profile with validated data
      const newProfile = {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Creating new profile:", newProfile)

      // Validate profile data before insertion
      const validationResult = validateUserData(newProfile)
      if (!validationResult.isValid) {
        console.error("Profile validation failed:", validationResult.errors)
        return null
      }

      // Try to insert with retry logic
      let retryCount = 0
      const maxRetries = 3
      let lastError = null

      while (retryCount < maxRetries) {
        try {
          const { data: createdProfile, error: createError } = await supabase
            .from("profiles")
            .insert([newProfile])
            .select()
            .single()

          if (createError) {
            // Check if it's a duplicate key error (profile might have been created in a race condition)
            if (createError.code === "23505") {
              console.log("Profile already exists (race condition), fetching existing profile")

              const { data: existingProfile, error: fetchError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single()

              if (fetchError) {
                logDatabaseError(fetchError, "fetching existing profile after duplicate key error", { userId })
                lastError = fetchError
                retryCount++
                continue
              }

              return existingProfile as UserProfile
            }

            logDatabaseError(createError, "creating profile", { userId, profile: newProfile })
            lastError = createError
            retryCount++

            // Add delay between retries
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
            continue
          }

          console.log("Profile created successfully:", createdProfile)
          return createdProfile as UserProfile
        } catch (error) {
          logDatabaseError(error, "creating profile in retry loop", { userId, retryCount })
          lastError = error
          retryCount++

          // Add delay between retries
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
        }
      }

      // If we get here, all retries failed
      console.error(`Failed to create profile after ${maxRetries} attempts. Last error:`, lastError)
      return null
    } catch (error) {
      logDatabaseError(error, "ensuring profile exists", { userId })
      return null
    }
  }

  /**
   * Fetches a user's profile from the database.
   * Includes safeguards against infinite loops and concurrent fetches.
   */
  const fetchProfile = async (userId: string) => {
    // Prevent concurrent fetches for the same user
    if (fetchingProfile.current[userId]) {
      console.log(`Already fetching profile for user: ${userId}`)
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

      console.log(`Fetching profile for user: ${userId} (Attempt: ${profileFetchAttempts.current[userId]})`)

      // First check if the profile exists - use safe operation
      const { data, error } = await safeDbOperation(async () => {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error) throw error
        return data
      }, "fetching profile")

      if (error) {
        // If no profile exists, ensure one is created
        if (error.message?.includes("No rows found")) {
          console.log(`No profile found for user ${userId}, creating one...`)
          const newProfile = await ensureProfile(userId)

          // Reset attempt counter on success
          if (newProfile) {
            profileFetchAttempts.current[userId] = 0
          }

          fetchingProfile.current[userId] = false
          return newProfile
        }

        console.error("Error fetching profile:", error)
        fetchingProfile.current[userId] = false
        return null
      }

      console.log(`Profile found for user ${userId}:`, data)

      // Reset attempt counter on success
      profileFetchAttempts.current[userId] = 0
      fetchingProfile.current[userId] = false

      return data as UserProfile
    } catch (error) {
      console.error("Unexpected error in fetchProfile:", error)
      logDatabaseError(error, "fetching profile", { userId })
      fetchingProfile.current[userId] = false
      return null
    }
  }

  /**
   * Refreshes the user's profile data.
   * Used when profile information might have changed.
   */
  const refreshProfile = async () => {
    if (!user) {
      console.log("Cannot refresh profile: No user logged in")
      return
    }

    console.log(`Refreshing profile for user: ${user.id}`)
    const profile = await fetchProfile(user.id)
    if (profile) {
      setProfile(profile)
      console.log("Profile refreshed successfully")
    } else {
      console.warn("Failed to refresh profile")
    }
  }

  // Initialize auth state and set up listener
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth state...")
        setIsLoading(true)

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
          console.log(`Session found for user: ${session.user.id}`)
          setUser(session.user)
          const profile = await fetchProfile(session.user.id)
          setProfile(profile)
        } else {
          console.log("No active session found")
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
      console.log(`Auth state changed: ${event}`)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log(`User authenticated: ${session.user.id}`)
        const profile = await fetchProfile(session.user.id)
        setProfile(profile)
      } else {
        console.log("User signed out")
        setProfile(null)
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh()
      }
    })

    initializeAuth()

    // Clean up subscription
    return () => {
      console.log("Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [router])

  /**
   * Signs up a new user with email, password, and optional full name.
   * Displays appropriate toast notifications for success or failure.
   */
  const signUp = async ({ email, password, full_name, persistSession = false }: SignUpCredentials) => {
    try {
      console.log(`Signing up user: ${email}`)

      // Validate input data
      if (!email || !password) {
        const errorMessage = "Email and password are required"
        console.error("Sign up validation error:", errorMessage)
        toast({
          title: "Sign up failed",
          description: errorMessage,
          variant: "destructive",
        })
        return { error: { message: errorMessage }, data: null }
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        const errorMessage = "Please enter a valid email address"
        console.error("Sign up validation error:", errorMessage)
        toast({
          title: "Sign up failed",
          description: errorMessage,
          variant: "destructive",
        })
        return { error: { message: errorMessage }, data: null }
      }

      // Password strength validation
      if (password.length < 8) {
        const errorMessage = "Password must be at least 8 characters long"
        console.error("Sign up validation error:", errorMessage)
        toast({
          title: "Sign up failed",
          description: errorMessage,
          variant: "destructive",
        })
        return { error: { message: errorMessage }, data: null }
      }

      // Create user account with retry logic
      let signUpAttempts = 0
      const maxSignUpAttempts = 3
      let lastError = null

      while (signUpAttempts < maxSignUpAttempts) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: full_name || "",
              },
              emailRedirectTo: `${window.location.origin}/auth/verify-email`,
            },
          })

          if (error) {
            console.error("Sign up error:", error)

            // Handle specific error cases
            if (error.message.includes("already registered")) {
              toast({
                title: "Account already exists",
                description: "This email is already registered. Please sign in instead.",
                variant: "destructive",
              })
              return { error, data: null }
            }

            // For other errors, retry
            lastError = error
            signUpAttempts++
            await new Promise((resolve) => setTimeout(resolve, 1000 * signUpAttempts))
            continue
          }

          console.log("Sign up successful:", data)

          // The profile will be created automatically by the database trigger
          // But we'll check and create it manually if needed as a fallback
          if (data.user) {
            try {
              // Wait a moment to allow the trigger to run
              await new Promise((resolve) => setTimeout(resolve, 1000))

              console.log(`Checking if profile was created for user: ${data.user.id}`)
              const profile = await fetchProfile(data.user.id)

              if (profile) {
                console.log("Profile exists:", profile)
              } else {
                console.warn("Profile not created by trigger, creating manually")
                const newProfile = await ensureProfile(data.user.id)

                if (!newProfile) {
                  console.error("Failed to create profile manually")
                  // Don't fail the sign-up process, but log the error
                  toast({
                    title: "Account created",
                    description:
                      "Your account was created, but there was an issue setting up your profile. Some features may be limited until you complete your profile.",
                    variant: "warning",
                  })
                }
              }
            } catch (profileError) {
              console.error("Error checking/creating profile during sign-up:", profileError)
              // Don't fail the sign-up process if profile creation fails
              // We'll try again when the user signs in
            }
          }

          toast({
            title: "Sign up successful",
            description: "Please check your email to verify your account.",
          })

          return { error: null, data }
        } catch (error: any) {
          console.error(`Sign up attempt ${signUpAttempts + 1} failed:`, error)
          lastError = error
          signUpAttempts++
          await new Promise((resolve) => setTimeout(resolve, 1000 * signUpAttempts))
        }
      }

      // If we get here, all attempts failed
      console.error(`Sign up failed after ${maxSignUpAttempts} attempts`)
      toast({
        title: "Sign up failed",
        description: lastError?.message || "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
      return { error: lastError, data: null }
    } catch (error: any) {
      console.error("Exception during sign up:", error)
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred. Please try again later or contact support.",
        variant: "destructive",
      })
      return { error, data: null }
    }
  }

  /**
   * Signs in a user with email and password.
   * Ensures a profile exists for the user and displays appropriate toast notifications.
   */
  const signIn = async ({ email, password, persistSession = false }: SignInCredentials) => {
    try {
      console.log(`Signing in user: ${email}`)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        })
        return { error, data: null }
      }

      console.log("Sign in successful:", data)

      if (data.user) {
        // Ensure profile exists
        console.log(`Ensuring profile exists for user: ${data.user.id}`)
        const profile = await fetchProfile(data.user.id)

        if (profile) {
          console.log("Profile found:", profile)
          setProfile(profile)
        } else {
          console.warn("Failed to fetch profile during sign-in")
          // Create profile as fallback
          const newProfile = await ensureProfile(data.user.id)
          if (newProfile) {
            setProfile(newProfile)
          } else {
            // If we still can't create a profile, show a warning but don't block sign-in
            console.error("Failed to create profile during sign-in")
            toast({
              title: "Profile setup incomplete",
              description: "Your profile could not be fully set up. Some features may be limited.",
              variant: "warning",
            })
          }
        }
      }

      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      })

      return { error: null, data }
    } catch (error: any) {
      console.error("Exception during sign in:", error)
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
  const signOut = async (redirectTo = "/auth/sign-in") => {
    try {
      console.log("Signing out user")

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Sign out error:", error)
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      console.log("Sign out successful")
      router.push(redirectTo)

      toast({
        title: "Sign out successful",
        description: "You have been successfully signed out.",
      })
    } catch (error: any) {
      console.error("Exception during sign out:", error)
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
  const updatePassword = async (data: PasswordUpdateData) => {
    try {
      console.log("Updating password")

      // First verify the current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: data.current_password,
      })

      if (verifyError) {
        console.error("Password verification error:", verifyError)
        toast({
          title: "Password update failed",
          description: "Current password is incorrect",
          variant: "destructive",
        })
        return { error: { message: "Current password is incorrect" } }
      }

      // Then update to the new password
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      })

      if (error) {
        console.error("Password update error:", error)
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      console.log("Password updated successfully")
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      })

      return { error: null }
    } catch (error: any) {
      console.error("Exception during password update:", error)
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
      console.log(`Sending password reset email to: ${email}`)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error("Password reset error:", error)
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      console.log("Password reset email sent successfully")
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password.",
      })

      return { error: null }
    } catch (error: any) {
      console.error("Exception during password reset:", error)
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
    ensureProfile,
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
