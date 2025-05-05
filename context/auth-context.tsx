"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase-client"
import { handleAuthError } from "@/utils/auth-error-handler"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"]

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signUp: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updatePassword: (passwords: { current_password: string; new_password: string }) => Promise<{ error: Error | null }>
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to delay execution (for retry logic)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabaseClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Use a timeout to avoid immediate fetch after page load
        setTimeout(() => {
          fetchProfile(session.user.id)
        }, 500)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Use a timeout to avoid immediate fetch after auth change
        setTimeout(() => {
          fetchProfile(session.user.id)
        }, 500)
      } else {
        setProfile(null)
        setIsLoading(false)
      }

      // Update server state
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Create a mock profile when we can't fetch the real one
  const createMockProfile = (userId: string, email?: string): UserProfile => {
    return {
      id: userId,
      email: email || "user@example.com",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      first_name: null,
      last_name: null,
      avatar_url: null,
    }
  }

  // Fetch user profile with retry logic
  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      // Add a delay before fetching to avoid rate limiting
      // Use exponential backoff for retries
      const backoffTime = retryCount === 0 ? 500 : Math.min(1000 * Math.pow(2, retryCount), 10000)
      await delay(backoffTime)

      console.log(`Fetching profile for user ${userId}, attempt ${retryCount + 1}`)

      const supabase = getSupabaseClient()

      // Use a direct fetch with error handling instead of the Supabase client
      // This gives us more control over error handling
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&limit=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      })

      // Check for rate limiting
      if (response.status === 429) {
        console.log(`Rate limited (429), retrying in ${backoffTime * 2}ms...`)

        // If we've tried too many times, use a mock profile
        if (retryCount >= 3) {
          console.log("Too many retries, using mock profile")
          setProfile(createMockProfile(userId, user?.email))
          setIsLoading(false)
          return
        }

        // Otherwise retry
        return fetchProfile(userId, retryCount + 1)
      }

      // Handle other errors
      if (!response.ok) {
        console.error(`Error fetching profile: ${response.status} ${response.statusText}`)

        // If we get a 404, the profile might not exist yet
        if (response.status === 404 || response.status === 406) {
          // Try to create the profile
          await createProfile(userId)
          return
        }

        // For other errors, use a mock profile after too many retries
        if (retryCount >= 2) {
          setProfile(createMockProfile(userId, user?.email))
        } else {
          return fetchProfile(userId, retryCount + 1)
        }

        setIsLoading(false)
        return
      }

      // Parse the response
      const data = await response.json()

      if (Array.isArray(data) && data.length > 0) {
        setProfile(data[0])
      } else if (user?.email) {
        // If no profile found, try to create one
        await createProfile(userId)
      } else {
        // If we can't create a profile, use a mock one
        setProfile(createMockProfile(userId, user?.email))
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error)

      // After several retries, use a mock profile
      if (retryCount >= 2) {
        setProfile(createMockProfile(userId, user?.email))
      } else {
        return fetchProfile(userId, retryCount + 1)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Create a profile
  const createProfile = async (userId: string) => {
    try {
      if (!user?.email) return

      const supabase = getSupabaseClient()

      // Create new profile
      const newProfile = {
        id: userId,
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("profiles").upsert(newProfile, { onConflict: "id" }).select().single()

      if (error) {
        console.error("Error creating profile:", error)
        setProfile(createMockProfile(userId, user.email))
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error("Unexpected error creating profile:", error)
      setProfile(createMockProfile(userId, user?.email))
    }
  }

  // Sign up
  const signUp = async ({ email, password }: { email: string; password: string }) => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { error: new Error(handleAuthError(error, "sign-up")) }
      }

      // Create user profile
      if (data.user) {
        await createProfile(data.user.id)
      }

      return { error: null }
    } catch (error: any) {
      return { error: new Error(handleAuthError(error, "sign-up")) }
    }
  }

  // Sign in
  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: new Error(handleAuthError(error, "sign-in")) }
      }

      return { error: null }
    } catch (error: any) {
      return { error: new Error(handleAuthError(error, "sign-in")) }
    }
  }

  // Sign out
  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push("/auth/sign-in")
  }

  // Update password
  const updatePassword = async ({
    current_password,
    new_password,
  }: { current_password: string; new_password: string }) => {
    try {
      const supabase = getSupabaseClient()

      // If we're resetting password (no current_password), just update
      if (!current_password) {
        const { error } = await supabase.auth.updateUser({
          password: new_password,
        })

        if (error) {
          return { error: new Error(handleAuthError(error, "password-update")) }
        }

        return { error: null }
      }

      // Otherwise, verify current password first by signing in
      if (!user?.email) {
        return { error: new Error("User email not found") }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current_password,
      })

      if (signInError) {
        return { error: new Error("Current password is incorrect") }
      }

      // Then update password
      const { error } = await supabase.auth.updateUser({
        password: new_password,
      })

      if (error) {
        return { error: new Error(handleAuthError(error, "password-update")) }
      }

      return { error: null }
    } catch (error: any) {
      return { error: new Error(handleAuthError(error, "password-update")) }
    }
  }

  // Update profile
  const updateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error("User not authenticated") }
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          ...updatedProfile,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        return { error: new Error(handleAuthError(error, "profile-update")) }
      }

      // Refresh profile
      fetchProfile(user.id)

      return { error: null }
    } catch (error: any) {
      return { error: new Error(handleAuthError(error, "profile-update")) }
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    updatePassword,
    updateProfile,
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
