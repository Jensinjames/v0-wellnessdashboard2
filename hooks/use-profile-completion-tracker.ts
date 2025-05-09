"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import type { ProfileCompletionStatus } from "@/types/auth"
import { isAnonymousProfile } from "@/utils/auth-utils"

export function useProfileCompletionTracker() {
  const { profile } = useAuth()
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus>({
    isComplete: false,
    missingFields: [],
    completionPercentage: 0,
  })

  useEffect(() => {
    if (!profile) {
      setCompletionStatus({
        isComplete: false,
        missingFields: ["first_name", "last_name"],
        completionPercentage: 0,
      })
      return
    }

    // Anonymous users are considered to have completed profiles
    if (isAnonymousProfile(profile)) {
      setCompletionStatus({
        isComplete: true,
        missingFields: [],
        completionPercentage: 100,
      })
      return
    }

    const missingFields: string[] = []

    if (!profile.first_name) {
      missingFields.push("first_name")
    }

    if (!profile.last_name) {
      missingFields.push("last_name")
    }

    // Optional fields that contribute to completion percentage
    const optionalFields = ["avatar_url", "phone"]
    const optionalMissing = optionalFields.filter((field) => !profile[field as keyof typeof profile])

    // Calculate completion percentage
    const requiredFields = ["first_name", "last_name"]
    const totalFields = requiredFields.length + optionalFields.length
    const missingCount = missingFields.length + optionalMissing.length
    const completedCount = totalFields - missingCount
    const completionPercentage = Math.round((completedCount / totalFields) * 100)

    setCompletionStatus({
      isComplete: missingFields.length === 0,
      missingFields,
      completionPercentage,
    })
  }, [profile])

  return completionStatus
}
