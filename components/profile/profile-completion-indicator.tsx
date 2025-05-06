"use client"

import { useProfileCompletion } from "@/hooks/use-profile-validation"
import { Progress } from "@/components/ui/progress"
import type { UserProfile } from "@/types/auth"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ProfileCompletionIndicatorProps {
  profile: UserProfile | null
  showDetails?: boolean
  className?: string
}

export function ProfileCompletionIndicator({
  profile,
  showDetails = false,
  className = "",
}: ProfileCompletionIndicatorProps) {
  const { isComplete, missingFields, completionPercentage } = useProfileCompletion(profile)

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Profile Completion</span>
        <span className="text-sm font-medium">{completionPercentage}%</span>
      </div>

      <Progress value={completionPercentage} className="h-2" />

      {showDetails && (
        <div className="mt-4 space-y-2">
          {isComplete ? (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Your profile is complete!</span>
            </div>
          ) : (
            <>
              <div className="flex items-center text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Please complete your profile</span>
              </div>

              {missingFields.length > 0 && (
                <ul className="pl-6 text-sm space-y-1">
                  {missingFields.map((field) => (
                    <li key={field} className="list-disc text-gray-600">
                      {field.replace("_", " ")}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
