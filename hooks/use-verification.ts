"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { requestVerificationCode, verifyCode, updatePhoneNumber } from "@/app/actions/verification"
import { getVerificationStatus } from "@/utils/verification-utils"
import type { VerificationType } from "@/types/auth"

export function useVerification() {
  const { user, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: false,
    phoneVerified: false,
    hasEmail: false,
    hasPhone: false,
  })

  // Fetch verification status
  const fetchVerificationStatus = useCallback(async () => {
    if (!user) return

    try {
      const status = await getVerificationStatus(user.id)
      setVerificationStatus(status)
    } catch (error) {
      console.error("Error fetching verification status:", error)
    }
  }, [user])

  // Request verification code
  const requestVerification = useCallback(
    async (type: VerificationType) => {
      if (!user) {
        setError("You must be logged in to verify your account")
        return false
      }

      setIsLoading(true)
      setError(null)
      setSuccess(null)

      try {
        const response = await requestVerificationCode({
          userId: user.id,
          type,
          value: type === "email" ? user.email : user.phone,
        })

        if (response.success) {
          setSuccess(response.message)
          setVerificationSent(true)
          if (response.expiresAt) {
            setExpiresAt(response.expiresAt)
          }
          return true
        } else {
          setError(response.message)
          return false
        }
      } catch (error) {
        console.error(`Error requesting ${type} verification:`, error)
        setError(`Failed to send verification code to your ${type}`)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user],
  )

  // Submit verification code
  const submitVerification = useCallback(
    async (type: VerificationType, code: string) => {
      if (!user) {
        setError("You must be logged in to verify your account")
        return false
      }

      setIsLoading(true)
      setError(null)
      setSuccess(null)

      try {
        const response = await verifyCode({
          userId: user.id,
          type,
          code,
        })

        if (response.success) {
          setSuccess(response.message)
          setVerificationSent(false)
          setExpiresAt(null)

          // Update local verification status
          setVerificationStatus((prev) => ({
            ...prev,
            [type === "email" ? "emailVerified" : "phoneVerified"]: true,
          }))

          // Refresh profile to get updated verification status
          await refreshProfile()

          return true
        } else {
          setError(response.message)
          return false
        }
      } catch (error) {
        console.error(`Error verifying ${type}:`, error)
        setError(`Failed to verify your ${type}`)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user, refreshProfile],
  )

  // Update phone number
  const updatePhone = useCallback(
    async (phone: string) => {
      if (!user) {
        setError("You must be logged in to update your phone number")
        return false
      }

      setIsLoading(true)
      setError(null)
      setSuccess(null)

      try {
        const response = await updatePhoneNumber(user.id, phone)

        if (response.success) {
          setSuccess(response.message)

          // Update local verification status
          setVerificationStatus((prev) => ({
            ...prev,
            hasPhone: true,
            phoneVerified: false,
          }))

          // Refresh profile to get updated phone number
          await refreshProfile()

          return true
        } else {
          setError(response.message)
          return false
        }
      } catch (error) {
        console.error("Error updating phone number:", error)
        setError("Failed to update phone number")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user, refreshProfile],
  )

  // Reset state
  const resetState = useCallback(() => {
    setError(null)
    setSuccess(null)
    setVerificationSent(false)
    setExpiresAt(null)
  }, [])

  return {
    isLoading,
    error,
    success,
    verificationSent,
    expiresAt,
    verificationStatus,
    fetchVerificationStatus,
    requestVerification,
    submitVerification,
    updatePhone,
    resetState,
  }
}
