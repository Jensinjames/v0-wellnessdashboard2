"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context-fixed"
import { getSupabaseClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

// Define types for profile data
export interface ProfileSettings {
  theme_preference?: string
  notification_preferences?: {
    email?: boolean
    push?: boolean
    in_app?: boolean
  }
  accessibility_settings?: {
    high_contrast?: boolean
    reduced_motion?: boolean
    large_text?: boolean
  }
}

// Profile context type definition
interface ProfileContextType {
  settings: ProfileSettings | null
  isLoading: boolean
  error: string | null
  updateSettings: (newSettings: Partial<ProfileSettings>) => Promise<void>
  refreshSettings: () => Promise<void>
}

// Create context with default values
const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

// Provider component
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [settings, setSettings] = useState<ProfileSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseClient()

  // Fetch profile settings when user or profile changes
  useEffect(() => {
    async function fetchProfileSettings() {
      if (!user || !profile) {
        setSettings(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase.from("profile_settings").select("*").eq("profile_id", user.id).single()

        if (error) {
          console.error("Error fetching profile settings:", error)
          setError("Failed to load profile settings")
          return
        }

        setSettings(data || {})
      } catch (err) {
        console.error("Unexpected error fetching profile settings:", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileSettings()
  }, [user, profile, supabase])

  // Update profile settings
  const updateSettings = async (newSettings: Partial<ProfileSettings>) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to update settings",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Merge with existing settings
      const updatedSettings = { ...settings, ...newSettings }

      const { error } = await supabase.from("profile_settings").upsert({
        profile_id: user.id,
        ...updatedSettings,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error updating profile settings:", error)
        setError("Failed to update settings")
        toast({
          title: "Update failed",
          description: "Could not update your settings",
          variant: "destructive",
        })
        return
      }

      setSettings(updatedSettings)
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully",
      })
    } catch (err) {
      console.error("Unexpected error updating settings:", err)
      setError("An unexpected error occurred")
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh profile settings
  const refreshSettings = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.from("profile_settings").select("*").eq("profile_id", user.id).single()

      if (error) {
        console.error("Error refreshing profile settings:", error)
        setError("Failed to refresh settings")
        return
      }

      setSettings(data || {})
    } catch (err) {
      console.error("Unexpected error refreshing settings:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Context value
  const value = {
    settings,
    isLoading,
    error,
    updateSettings,
    refreshSettings,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

// Custom hook to use the profile context
export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}
