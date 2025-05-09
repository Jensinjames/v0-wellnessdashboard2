"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useSupabaseContext } from "@/components/providers/supabase-provider"

// Define the shape of a profile
interface Profile {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  updated_at?: string | null
}

// Define the shape of our profile completion context
interface ProfileCompletionContextType {
  profile: Profile | null
  isProfileComplete: boolean
  isLoading: boolean
  error: Error | null
  refreshProfile: () => Promise<void>
}

// Create the context with default values
const ProfileCompletionContext = createContext<ProfileCompletionContextType>({
  profile: null,
  isProfileComplete: false,
  isLoading: true,
  error: null,
  refreshProfile: async () => {},
})

// Hook to use the profile completion context
export const useProfileCompletion = () => useContext(ProfileCompletionContext)

interface ProfileCompletionProviderProps {
  children: React.ReactNode
}

export function ProfileCompletionProvider({ children }: ProfileCompletionProviderProps) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { supabase, isLoading: isSupabaseLoading } = useSupabaseContext()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Check if profile is complete
  const isProfileComplete = Boolean(profile?.first_name && profile?.last_name && profile?.email)

  // Fetch profile data
  const fetchProfile = async () => {
    if (!supabase || !user) {
      setProfile(null)
      return
    }

    try {
      setIsLoading(true)

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        throw error
      }

      setProfile(data)

      // Store profile completion status in cookie for middleware
      if (typeof document !== "undefined") {
        document.cookie = `profile-complete=${isProfileComplete ? "true" : "false"}; path=/; max-age=86400`
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch profile"))
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh profile data
  const refreshProfile = async () => {
    await fetchProfile()
  }

  // Fetch profile when user changes
  useEffect(() => {
    if (isAuthLoading || isSupabaseLoading) return

    fetchProfile()
  }, [user, isAuthLoading, isSupabaseLoading])

  return (
    <ProfileCompletionContext.Provider
      value={{
        profile,
        isProfileComplete,
        isLoading: isLoading || isAuthLoading || isSupabaseLoading,
        error,
        refreshProfile,
      }}
    >
      {children}
    </ProfileCompletionContext.Provider>
  )
}
