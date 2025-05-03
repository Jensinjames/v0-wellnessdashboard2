"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  bio: string | null
  updated_at: string
}

interface UseUserDataReturn {
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
  updateProfile: (
    updates: Partial<Omit<UserProfile, "id" | "updated_at">>,
  ) => Promise<{ success: boolean; data?: UserProfile; error?: Error }>
  uploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: Error }>
  refreshProfile: () => Promise<void>
}

export function useUserData(): UseUserDataReturn {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        throw error
      }

      setProfile(data)
    } catch (err) {
      console.error("Error fetching user profile:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch user profile"))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Update user profile
  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, "id" | "updated_at">>) => {
      if (!user) {
        return { success: false, error: new Error("User not authenticated") }
      }

      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("profiles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single()

        if (error) {
          throw error
        }

        setProfile(data)

        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })

        return { success: true, data }
      } catch (err) {
        console.error("Error updating user profile:", err)

        const errorObj = err instanceof Error ? err : new Error("Failed to update user profile")
        setError(errorObj)

        toast({
          title: "Profile update failed",
          description: errorObj.message,
          variant: "destructive",
        })

        return { success: false, error: errorObj }
      } finally {
        setIsLoading(false)
      }
    },
    [user],
  )

  // Upload avatar
  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) {
        return { success: false, error: new Error("User not authenticated") }
      }

      try {
        setIsLoading(true)
        setError(null)

        // Validate file type and size
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `avatars/${fileName}`

        // Check file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if (!allowedTypes.includes(file.type)) {
          throw new Error("Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.")
        }

        // Check file size (max 2MB)
        const maxSize = 2 * 1024 * 1024 // 2MB
        if (file.size > maxSize) {
          throw new Error("File too large. Maximum size is 2MB.")
        }

        // Upload file to storage
        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

        const avatarUrl = publicUrlData.publicUrl

        // Update user profile with new avatar URL
        const { data, error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        setProfile(data)

        toast({
          title: "Avatar updated",
          description: "Your profile picture has been successfully updated.",
        })

        return { success: true, url: avatarUrl }
      } catch (err) {
        console.error("Error uploading avatar:", err)

        const errorObj = err instanceof Error ? err : new Error("Failed to upload avatar")
        setError(errorObj)

        toast({
          title: "Avatar upload failed",
          description: errorObj.message,
          variant: "destructive",
        })

        return { success: false, error: errorObj }
      } finally {
        setIsLoading(false)
      }
    },
    [user],
  )

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    uploadAvatar,
    refreshProfile,
  }
}
