"use client"

import { useCallback } from "react"
import { updateUserProfile } from "@/app/actions/auth-actions"
import { useAuthState } from "./use-auth-state"
import { getUserProfile } from "@/lib/supabase-client"

interface ProfileData {
  name?: string
  phone?: string
  location?: string
  [key: string]: any
}

interface ProfileResponse {
  success: boolean
  error?: string
}

export function useProfile(userId?: string) {
  const [profileState, { setLoading: setProfileLoading, setSuccess: setProfileSuccess, setError: setProfileError }] =
    useAuthState<ProfileData>()

  const [updateState, { setLoading: setUpdateLoading, setSuccess: setUpdateSuccess, setError: setUpdateError }] =
    useAuthState<ProfileResponse>()

  const fetchProfile = useCallback(
    async (id?: string) => {
      if (!id && !userId) {
        setProfileError("User ID is required to fetch profile")
        return null
      }

      setProfileLoading()

      try {
        const profile = await getUserProfile(id || userId!)

        if (profile) {
          setProfileSuccess(profile)
          return profile
        } else {
          setProfileError("Failed to fetch profile")
          return null
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        setProfileError(errorMessage)
        return null
      }
    },
    [userId, setProfileLoading, setProfileSuccess, setProfileError],
  )

  const updateProfile = useCallback(
    async (data: ProfileData) => {
      setUpdateLoading()

      try {
        // Create form data for the server action
        const formData = new FormData()

        // Add all profile fields to the form data
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value))
          }
        })

        // Call the server action
        const result = await updateUserProfile(formData)

        if (result.success) {
          setUpdateSuccess(result)

          // Refresh the profile data
          if (userId) {
            fetchProfile(userId)
          }
        } else {
          setUpdateError(result.error || "An unknown error occurred")
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        setUpdateError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [userId, fetchProfile, setUpdateLoading, setUpdateSuccess, setUpdateError],
  )

  return {
    fetchProfile,
    updateProfile,
    profile: profileState.data,
    profileState: {
      isLoading: profileState.isLoading,
      isSuccess: profileState.isSuccess,
      isError: profileState.isError,
      error: profileState.error,
    },
    updateState: {
      isLoading: updateState.isLoading,
      isSuccess: updateState.isSuccess,
      isError: updateState.isError,
      error: updateState.error,
    },
  }
}
