"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  // Replace the fetchProfile function with this improved version that handles missing profiles
  const fetchProfile = async (userId: string) => {
    try {
      // First check if the profile exists
      const { data, error, count } = await supabase.from("profiles").select("*", { count: "exact" }).eq("id", userId)

      // If no profile exists, create one
      if (count === 0) {
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
            return null
          }

          return createdProfile as UserProfile
        }
        return null
      }

      // If multiple profiles exist (shouldn't happen, but just in case)
      if (count > 1) {
        console.warn(`Multiple profiles found for user ${userId}. Using the first one.`)
      }

      // Return the first profile if it exists
      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      return data[0] as UserProfile
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      return null
    }
  }

  // Refresh the user profile
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
        } = await supabase.auth.getSession()
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

      if (event === "SIGNED_IN") {
        router.refresh()
      } else if (event === "SIGNED_OUT") {
        router.refresh()
      }
    })

    initializeAuth()

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Sign up function
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

      if (!error && data.user) {
        toast({
          title: "Account created",
          description: "Please check your email to verify your account.",
        })
      }

      return { data, error }
    } catch (error) {
      console.error("Error in signUp:", error)
      return { data: null, error }
    }
  }

  // Sign in function
  const signIn = async (credentials: SignInCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (!error && data.user) {
        // Ensure profile exists
        const profile = await fetchProfile(data.user.id)
        setProfile(profile)

        toast({
          title: "Welcome back!",
          description: `You've successfully signed in.`,
        })
      }

      return { data, error }
    } catch (error) {
      console.error("Error in signIn:", error)
      return { data: null, error }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/sign-in")
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "There was a problem signing you out.",
        variant: "destructive",
      })
    }
  }

  // Update password function
  const updatePassword = async (data: PasswordUpdateData) => {
    try {
      // First verify the current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: data.current_password,
      })

      if (verifyError) {
        return { error: { message: "Current password is incorrect" } }
      }

      // Then update to the new password
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      })

      if (!error) {
        toast({
          title: "Password updated",
          description: "Your password has been successfully updated.",
        })
      }

      return { error }
    } catch (error) {
      console.error("Error updating password:", error)
      return { error }
    }
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (!error) {
        toast({
          title: "Password reset email sent",
          description: "Check your email for a link to reset your password.",
        })
      }

      return { error }
    } catch (error) {
      console.error("Error resetting password:", error)
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

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
