"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useProfileCompletion } from "@/hooks/use-profile-validation"
import { X } from "lucide-react"
import Link from "next/link"

export function ProfileCompletionReminder() {
  const { profile } = useAuth()
  const { isComplete } = useProfileCompletion(profile)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if the reminder has been dismissed recently
    const dismissedUntil = localStorage.getItem("profile_reminder_dismissed_until")
    const isDismissedUntil = dismissedUntil && new Date(dismissedUntil) > new Date()

    // Only show if profile is incomplete and not dismissed
    setIsVisible(!isComplete && !isDismissedUntil && !isDismissed)
  }, [isComplete, isDismissed])

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissUntil = new Date()
    dismissUntil.setHours(dismissUntil.getHours() + 24)
    localStorage.setItem("profile_reminder_dismissed_until", dismissUntil.toISOString())

    setIsDismissed(true)
  }

  if (!isVisible) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-sm text-amber-800">
          Your profile is incomplete.{" "}
          <Link href="/profile" className="font-medium underline">
            Complete it now
          </Link>{" "}
          to access all features.
        </div>
        <button onClick={handleDismiss} className="text-amber-600 hover:text-amber-800" aria-label="Dismiss reminder">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
