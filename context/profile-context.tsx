"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import type { FullProfile, ProfileUpdateData, PreferencesUpdateData, ProfileCompletionStatus } from "@/types/profile"
import { profileSchema, preferencesSchema, calculateProfileCompletion } from "@/types/profile"
import { getCachedProfile, setCachedProfile, clearCachedProfile } from "@/services/profile-cache"
import { migrateProfile } from "@/utils/profile-migration"

interface ProfileContextType {
  profile: FullProfile | null
  isLoading: boolean
  error: string | null
  completionStatus: ProfileCompletionStatus | null
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>
  updatePreferences: (data: PreferencesUpdateData) => Promise<{ success: boolean; error?: string }>
  uploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>
  deleteAvatar: () => Promise<{ success: boolean; error?: string }>
  fetchProfile: () => Promise<FullProfile | null>
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // Initialize state
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus | null>(null)
  const [authAvailable, setAuthAvailable] = useState<boolean>(false)
  const [user, setUser] = useState<any>(null)

  const supabase = getSupabaseClient()

  // Check if auth context is available
  useEffect(() => {
    try {
      // Try to get the auth user from Supabase directly
      const getUser = async () => {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          setUser(data.user)
          setAuthAvailable(true)
        } else {
          setAuthAvailable(false)
        }
        setIsLoading(false)
      }

      getUser()
    } catch (error) {
      console.error("Error checking auth:", error)
      setAuthAvailable(false)
      setIsLoading(false)
    }
  }, [supabase])

  // Fetch profile from database with validation and caching
  const fetchProfile = useCallback(async (): Promise<FullProfile | null> => {
    if (!user) {
      setIsLoading(false)
      return null
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check cache first
      const cachedProfile = getCachedProfile(user.id)
      if (cachedProfile) {
        setProfile(cachedProfile)
        setCompletionStatus(calculateProfileCompletion(cachedProfile))
        setIsLoading(false)
        return cachedProfile
      }

      // Fetch from database
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Error fetching profile:", error)
        setError("Failed to load profile")
        setIsLoading(false)
        return null
      }

      // Validate profile data
      try {
        const validatedProfile = profileSchema.parse(data)

        // Check if profile needs migration
        if (!data.username || !data.theme_preference) {
          const migratedProfile = await migrateProfile(user.id)
          if (migratedProfile) {
            // Update cache and state with migrated profile
            setCachedProfile(user.id, migratedProfile)
            setProfile(migratedProfile)
            setCompletionStatus(calculateProfileCompletion(migratedProfile))
            setIsLoading(false)
            return migratedProfile
          }
        }

        // If no migration needed or migration failed, use the validated profile
        const fullProfile = data as FullProfile
        setCachedProfile(user.id, fullProfile)
        setProfile(fullProfile)
        setCompletionStatus(calculateProfileCompletion(fullProfile))
        return fullProfile
      } catch (validationError) {
        console.error("Profile validation error:", validationError)
        setError("Profile data is invalid")
        return null
      }
    } catch (err) {
      console.error("Exception in fetchProfile:", err)
      setError("An unexpected error occurred")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  // Refresh profile data
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (user) {
      // Clear cache to force a fresh fetch
      clearCachedProfile(user.id)
      await fetchProfile()
    }
  }, [user, fetchProfile])

  // Update profile information
  const updateProfile = async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      // Validate the update data
      const validatedData = profileSchema.partial().parse({
        ...profile,
        ...data,
      })

      const { error } = await supabase
        .from("profiles")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error updating profile:", error)
        return { success: false, error: error.message }
      }

      // Update cache and state
      await refreshProfile()

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Exception in updateProfile:", err)
      return { success: false, error: err.message || "Failed to update profile" }
    }
  }

  // Update user preferences
  const updatePreferences = async (data: PreferencesUpdateData): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      // Validate the preferences data
      const validatedData = preferencesSchema.partial().parse({
        ...profile,
        ...data,
      })

      const { error } = await supabase
        .from("profiles")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error updating preferences:", error)
        return { success: false, error: error.message }
      }

      // Update cache and state
      await refreshProfile()

      toast({
        title: "Preferences updated",
        description: "Your preferences have been successfully updated.",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Exception in updatePreferences:", err)
      return { success: false, error: err.message || "Failed to update preferences" }
    }
  }

  // Upload avatar image
  const uploadAvatar = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return { success: false, error: "File must be an image" }
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: "File size must be less than 5MB" }
      }

      // Upload to storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file)

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError)
        return { success: false, error: uploadError.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("profiles").getPublicUrl(filePath)

      const avatarUrl = urlData.publicUrl

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating profile with avatar:", updateError)
        return { success: false, error: updateError.message }
      }

      // Update cache and state
      await refreshProfile()

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been successfully updated.",
      })

      return { success: true, url: avatarUrl }
    } catch (err: any) {
      console.error("Exception in uploadAvatar:", err)
      return { success: false, error: err.message || "Failed to upload avatar" }
    }
  }

  // Delete avatar
  const deleteAvatar = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile?.avatar_url) {
      return { success: false, error: "No avatar to delete" }
    }

    try {
      // Extract file path from URL
      const url = new URL(profile.avatar_url)
      const filePath = url.pathname.split("/").pop()

      if (filePath) {
        // Delete from storage
        const { error: deleteError } = await supabase.storage.from("profiles").remove([`avatars/${filePath}`])

        if (deleteError) {
          console.error("Error deleting avatar from storage:", deleteError)
          // Continue anyway to update the profile
        }
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating profile after avatar deletion:", updateError)
        return { success: false, error: updateError.message }
      }

      // Update cache and state
      await refreshProfile()

      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      })

      return { success: true }
    } catch (err: any) {
      console.error("Exception in deleteAvatar:", err)
      return { success: false, error: err.message || "Failed to delete avatar" }
    }
  }

  // Initialize profile on auth change
  useEffect(() => {
    if (authAvailable && user) {
      fetchProfile()
    } else {
      setIsLoading(false)
    }
  }, [authAvailable, user, fetchProfile])

  // If auth is not available, render children without the context
  if (!authAvailable) {
    console.warn("Auth not available, ProfileProvider will not provide profile functionality")
    return <>{children}</>
  }

  const value = {
    profile,
    isLoading,
    error,
    completionStatus,
    updateProfile,
    updatePreferences,
    uploadAvatar,
    deleteAvatar,
    fetchProfile,
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
