"use client"

import { useCallback, useState } from "react"
import { verifyUserProfile } from "@/utils/profile-verification"
import { useAuth } from "@/context/auth-context"

export function useProfileVerification() {
  const { user } = useAuth()
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastVerification, setLastVerification] = useState<{
    timestamp: number
    success: boolean
    error: string | null
  } | null>(null)

  const verifyProfile = useCallback(async () => {
    if (!user) {
      return { success: false, error: "No user logged in" }
    }

    setIsVerifying(true)
    try {
      const result = await verifyUserProfile(user.id)

      setLastVerification({
        timestamp: Date.now(),
        success: result.exists || result.created,
        error: result.error ? result.error.message : null,
      })

      return {
        success: result.exists || result.created,
        error: result.error ? result.error.message : null,
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      setLastVerification({
        timestamp: Date.now(),
        success: false,
        error: errorMessage,
      })

      return { success: false, error: errorMessage }
    } finally {
      setIsVerifying(false)
    }
  }, [user])

  return {
    verifyProfile,
    isVerifying,
    lastVerification,
  }
}
