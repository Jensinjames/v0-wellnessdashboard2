"use client"

/**
 * Auth User Hook
 *
 * Provides authenticated access to the current user and profile
 */

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context-improved"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "@/types/auth"
import { getUserProfile } from "@/lib/user-data-service"

interface UseAuthUserOptions {
  redirectTo?: string // Where to redirect if user is not authenticated
  requireAuth?: boolean // Whether authentication is required
}

export function useAuthUser(options: UseAuthUserOptions = {}) {
  const { redirectTo = "/auth/sign-in", requireAuth = true } = options
  const { user, profile, getUser, refreshProfile, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const router = useRouter()

  // Handle client-side detection
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize and check auth
  useEffect(() => {
    if (!isClient || isInitialized) return

    const initialize = async () => {
      try {
        // Check if user is already available in auth context
        if (user) {
          setCurrentUser(user)
          setUserProfile(profile)
          setIsAuthorized(true)
          setIsInitialized(true)
          return
        }

        // Fetch user data when not immediately available
        const fetchedUser = await getUser()

        if (fetchedUser) {
          setCurrentUser(fetchedUser)
          setIsAuthorized(true)

          // Get profile if not already in context
          if (!profile) {
            setIsLoadingProfile(true)
            const fetchedProfile = await getUserProfile(fetchedUser.id)
            setUserProfile(fetchedProfile)
            setIsLoadingProfile(false)
          } else {
            setUserProfile(profile)
          }
        } else if (requireAuth) {
          // Redirect if auth is required but user is not authenticated
          router.push(`${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`)
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("Error initializing auth user:", error)
        setIsInitialized(true)

        if (requireAuth) {
          router.push(`${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`)
        }
      }
    }

    initialize()
  }, [isClient, isInitialized, user, profile, getUser, requireAuth, redirectTo, router])

  // Update profile from context when it changes
  useEffect(() => {
    if (profile && (!userProfile || profile.id !== userProfile.id)) {
      setUserProfile(profile)
    }
  }, [profile, userProfile])

  // Fetch latest profile data
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!currentUser) return null

    setIsLoadingProfile(true)
    try {
      const updatedProfile = await refreshProfile()
      setUserProfile(updatedProfile)
      return updatedProfile
    } catch (error) {
      console.error("Error fetching profile:", error)
      return null
    } finally {
      setIsLoadingProfile(false)
    }
  }, [currentUser, refreshProfile])

  return {
    user: currentUser,
    profile: userProfile,
    isLoading: isLoading || !isInitialized,
    isLoadingProfile,
    isAuthorized,
    fetchProfile,
  }
}
