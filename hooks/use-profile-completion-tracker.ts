"use client"

import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useProfileCompletion } from "@/hooks/use-profile-validation"
import { useRouter, usePathname } from "next/navigation"

interface ProfileCompletionTrackerOptions {
  redirectIncomplete?: boolean
  redirectTo?: string
  excludePaths?: string[]
  onlyCheckOnMount?: boolean
}

/**
 * Hook to track profile completion status and optionally redirect
 * incomplete profiles to the profile page
 */
export function useProfileCompletionTracker({
  redirectIncomplete = false,
  redirectTo = "/profile",
  excludePaths = ["/profile", "/auth"],
  onlyCheckOnMount = true,
}: ProfileCompletionTrackerOptions = {}) {
  const { profile, isLoading } = useAuth()
  const { isComplete, completionPercentage, missingFields } = useProfileCompletion(profile)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip if still loading or if we only check on mount and this isn't the first render
    if (isLoading || (onlyCheckOnMount && !isComplete)) return

    // Skip if on an excluded path
    const isExcludedPath = excludePaths.some((path) => pathname?.startsWith(path))
    if (isExcludedPath) return

    // Redirect if profile is incomplete and redirectIncomplete is true
    if (!isComplete && redirectIncomplete) {
      router.push(redirectTo)
    }
  }, [isComplete, isLoading, redirectIncomplete, redirectTo, router, pathname, excludePaths, onlyCheckOnMount])

  return {
    isComplete,
    completionPercentage,
    missingFields,
    isLoading,
  }
}
