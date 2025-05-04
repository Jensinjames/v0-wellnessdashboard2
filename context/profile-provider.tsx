"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context-fixed"
import profileService from "@/services/profile-service"
import type { UserProfile } from "@/types/profile"

interface ProfileContextType {
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const userProfile = await profileService.getProfile(user.id)
      setProfile(userProfile)
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch profile"))
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return null

    try {
      const updatedProfile = await profileService.updateProfile(user.id, updates)

      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      return updatedProfile
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err instanceof Error ? err : new Error("Failed to update profile"))
      return null
    }
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile()
  }, [user?.id])

  const value = {
    profile,
    isLoading,
    error,
    updateProfile,
    refreshProfile,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)

  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }

  return context
}
