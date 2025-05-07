"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useProfileCompletion } from "@/context/profile-completion-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function ProfileReminderBanner() {
  const { profile } = useAuth()
  const { isSkipped, isComplete } = useProfileCompletion()
  const [dismissed, setDismissed] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only show the banner if the profile is incomplete and the user has skipped completion
    if (profile && isSkipped && !isComplete && !dismissed) {
      setShouldShow(true)
    } else {
      setShouldShow(false)
    }
  }, [profile, isSkipped, isComplete, dismissed])

  if (!shouldShow) return null

  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <div className="flex justify-between items-start w-full">
        <div>
          <AlertTitle className="text-blue-800">Complete your profile</AlertTitle>
          <AlertDescription className="text-blue-700">
            Your profile is incomplete. Adding your name helps personalize your experience.
          </AlertDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() => router.push("/profile/complete")}
          >
            Complete Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-700 hover:bg-blue-100"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}
