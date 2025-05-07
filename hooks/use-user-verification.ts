"use client"

import { useState, useCallback, useEffect } from "react"
import { useSupabase } from "./use-supabase"
import { useAuth } from "@/context/auth-context"
import { useToast } from "./use-toast"
import type { UserProfileData, VerificationStatus } from "@/utils/user-verification-utils"

export function useUserVerification() {
  const { supabase, isInitialized, verifyUser, getUserProfile } = useSupabase()
  const { user } = useAuth()
  const { toast } = useToast()

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Get verification status and profile on mount or when user changes
  useEffect(() => {
    if (!isInitialized || !user?.id) return

    async function loadInitialData() {
      setIsLoading(true)

      try {
        // Get verification status using our edge function
        const { data: verificationData, error: verificationError } = await verifyUser("", "get-verification-status")

        if (verificationError) {
          console.error("Error loading verification status:", verificationError)
          toast({
            title: "Error",
            description: "Failed to load verification status",
            variant: "destructive",
          })
        } else if (verificationData) {
          setVerificationStatus({
            emailVerified: verificationData.emailVerified,
            phoneVerified: verificationData.phoneVerified,
            verificationInProgress: false,
          })
        }

        // Get user profile
        const { data: profileData, error: profileError } = await getUserProfile(user.id)

        if (profileError) {
          console.error("Error loading user profile:", profileError)
        } else if (profileData) {
          setProfile(profileData)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [isInitialized, user, toast, verifyUser, getUserProfile])

  // Check if a user exists with the given email
  const checkUserExists = useCallback(
    async (email: string) => {
      if (!isInitialized) return { exists: false, error: "Client not initialized" }

      try {
        const { data, error } = await verifyUser(email, "verify-signup")

        if (error) {
          return { exists: false, error }
        }

        return { exists: data?.exists || false, verified: data?.verified || false, error: null }
      } catch (err: any) {
        console.error("Error checking if user exists:", err)
        return { exists: false, error: err.message || "Unknown error" }
      }
    },
    [isInitialized, verifyUser],
  )

  // Function to refresh verification status
  const refreshVerificationStatus = useCallback(async () => {
    if (!isInitialized || !user?.id) return

    setIsLoading(true)

    try {
      const { data, error } = await verifyUser("", "get-verification-status")

      if (error) {
        toast({
          title: "Error",
          description: "Failed to refresh verification status",
          variant: "destructive",
        })
        return false
      }

      setVerificationStatus({
        emailVerified: data.emailVerified,
        phoneVerified: data.phoneVerified,
        verificationInProgress: false,
      })

      return true
    } catch (err) {
      console.error("Error refreshing verification status:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized, user, verifyUser, toast])

  // Send email verification
  const sendEmailVerification = useCallback(async () => {
    if (!isInitialized || !user?.id || !supabase) return { success: false, error: "Not initialized" }

    setIsVerifying(true)

    try {
      // Use the native Supabase client for this operation
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      })

      if (error) throw error

      // Update verification status
      setVerificationStatus((prev) =>
        prev
          ? {
              ...prev,
              verificationInProgress: true,
              lastVerificationAttempt: new Date().toISOString(),
            }
          : null,
      )

      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link",
      })

      return { success: true, error: null }
    } catch (err: any) {
      console.error("Error sending verification email:", err)

      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again later.",
        variant: "destructive",
      })

      return { success: false, error: err.message || "Unknown error" }
    } finally {
      setIsVerifying(false)
    }
  }, [isInitialized, user, supabase, toast])

  return {
    verificationStatus,
    profile,
    isLoading,
    isVerifying,
    checkUserExists,
    refreshVerificationStatus,
    sendEmailVerification,
  }
}
