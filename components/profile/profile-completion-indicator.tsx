import { Progress } from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, ChevronRight, CheckCircle } from "lucide-react"
import type { UserProfile } from "@/types/auth"
import { useProfileCompletion } from "@/hooks/use-profile-validation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProfileCompletionIndicatorProps {
  profile: UserProfile | null
  showDetails?: boolean
  showCta?: boolean
  className?: string
}

export function ProfileCompletionIndicator({
  profile,
  showDetails = false,
  showCta = false,
  className = "",
}: ProfileCompletionIndicatorProps) {
  const { isComplete, completionPercentage, missingFields } = useProfileCompletion(profile)

  if (isComplete) {
    return (
      <Alert className={`bg-green-50 border-green-200 ${className}`}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Profile Complete</AlertTitle>
        <AlertDescription className="text-green-700">Your profile is complete and up to date.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Profile Incomplete</AlertTitle>
        <AlertDescription className="text-amber-700">
          Please complete your profile to access all features.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Profile completion</span>
          <span className="font-medium">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {profile?.email_verified ? (
        <div className="flex items-center mt-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span>Email verified</span>
        </div>
      ) : (
        <div className="flex items-center mt-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>Email not verified</span>
        </div>
      )}

      {showDetails && missingFields.length > 0 && (
        <div className="rounded-md bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-800 mb-2">Missing information:</p>
          <ul className="list-disc pl-5 text-amber-700 space-y-1">
            {missingFields.map((field) => (
              <li key={field}>
                {field === "first_name"
                  ? "First name"
                  : field === "last_name"
                    ? "Last name"
                    : field === "avatar_url"
                      ? "Profile picture"
                      : field === "email_verification"
                        ? "Verify your email address"
                        : field}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCta && (
        <Button asChild className="w-full mt-2">
          <Link href="/profile">
            Complete Profile <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
