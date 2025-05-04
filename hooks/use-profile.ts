"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "./use-supabase"
import { useSupabaseAuth } from "./use-supabase-auth"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

interface ProfileState {
  profile: Profile | null
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for managing user profiles
 */
export function useProfile() {
  const { user } = useSupabaseAuth()
  const supabase = useSupabase()
  const [state, setState] = useState<ProfileState>({
    profile: null,
    isLoading: true,
    error: null,
  })

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return null
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        // If no profile exists, create one
        if (error.code === "PGRST116") {
          return await createProfile()
        }
        throw error
      }

      setState({
        profile: data,
        isLoading: false,
        error: null,
      })

      return data
    } catch (error) {
      console.error("Error fetching profile:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
      return null
    }
  }, [user, supabase])

  const createProfile = useCallback(async () => {
    if (!user) return null

    try {
      const newProfile = {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("profiles").insert([newProfile]).select().single()

      if (error) {
        throw error
      }

      setState({
        profile: data,
        isLoading: false,
        error: null,
      })

      return data
    } catch (error) {
      console.error("Error creating profile:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
      return null
    }
  }, [user, supabase])

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user) {
      return { success: false, error: new Error("No user authenticated") }
    }

    try {
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

      setState((prev) => ({
        ...prev,
        profile: data,
      }))

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })

      return { success: true, data, error: null }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      })
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user) {
      return { success: false, error: new Error("No user authenticated") }
    }
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return { success: false, error: new Error("File must be an image") }
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: new Error("File size must be less than 5MB") }
      }

      // Upload to storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("profiles").getPublicUrl(filePath)

      const avatarUrl = urlData.publicUrl

      // Update profile with new avatar URL
      const { data, error } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setState((prev) => ({
        ...prev,
        profile: data,
      }))

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been successfully updated.",
      })

      return { success: true, url: avatarUrl, error: null }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your avatar.",
        variant: "destructive",
      })
      return {
        success: false,
        url: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  const deleteAvatar = async () => {
    if (!user || !state.profile?.avatar_url) {
      return { success: false, error: new Error("No avatar to delete") }
    }

    try {
      // Extract file path from URL
      const url = new URL(state.profile.avatar_url)
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
      const { data, error } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setState((prev) => ({
        ...prev,
        profile: data,
      }))

      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      })

      return { success: true, error: null }
    } catch (error) {
      console.error("Error deleting avatar:", error)
      toast({
        title: "Delete failed",
        description: "There was a problem removing your avatar.",
        variant: "destructive",
      })
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  // Initialize profile on auth change
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    ...state,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refreshProfile: fetchProfile,
  }
}
