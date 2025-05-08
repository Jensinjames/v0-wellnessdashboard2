/**
 * Redirect Manager
 * Centralized utility for managing authentication-related redirects
 */
import { isClient } from "@/lib/env"

// Safe destinations that are always allowed for redirects
const SAFE_DESTINATIONS = ["/dashboard", "/profile", "/goals", "/categories", "/secure-dashboard", "/goals-hierarchy"]

// Role-based default destinations
const ROLE_DESTINATIONS: Record<string, string> = {
  user: "/dashboard",
  admin: "/admin/dashboard",
  coach: "/coach/dashboard",
}

// Paths that should redirect to onboarding if profile is incomplete
const PATHS_REQUIRING_COMPLETE_PROFILE = ["/dashboard", "/goals", "/secure-dashboard"]

/**
 * Validates a redirect URL to prevent open redirect vulnerabilities
 */
export function validateRedirectUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    // Check if it's a relative URL (starts with /)
    if (url.startsWith("/")) {
      // Prevent redirects to authentication pages after sign-in
      if (url.startsWith("/auth/")) {
        return null
      }
      return url
    }

    // If it's an absolute URL, check if it's for the same origin
    if (isClient()) {
      const currentOrigin = window.location.origin
      try {
        const urlObj = new URL(url)
        if (urlObj.origin === currentOrigin) {
          // It's for the same origin, so extract the path and query
          return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`
        }
      } catch (e) {
        // Invalid URL, ignore it
        return null // Add explicit return for invalid URL case
      }
    }

    return null
  } catch (error) {
    console.error("Error validating redirect URL:", error)
    return null
  }
}

/**
 * Gets the appropriate redirect destination based on user role and profile status
 */
export function getRedirectDestination({
  role = "user",
  isProfileComplete = true,
  intendedDestination = null,
  isAuthenticated = true,
}: {
  role?: string
  isProfileComplete?: boolean
  intendedDestination?: string | null
  isAuthenticated?: boolean
}): string {
  // If not authenticated, redirect to sign-in
  if (!isAuthenticated) {
    return "/auth/sign-in"
  }

  // Validate the intended destination
  const validatedDestination = validateRedirectUrl(intendedDestination)

  // If profile is incomplete and the destination requires a complete profile,
  // redirect to profile completion page
  if (
    !isProfileComplete &&
    validatedDestination &&
    PATHS_REQUIRING_COMPLETE_PROFILE.some((path) => validatedDestination.startsWith(path))
  ) {
    return "/profile/complete"
  }

  // If there's a valid intended destination, use it
  if (validatedDestination) {
    return validatedDestination
  }

  // Otherwise, use the role-based destination
  return ROLE_DESTINATIONS[role] || ROLE_DESTINATIONS.user
}

/**
 * Stores the current URL for later redirect
 */
export function storeCurrentUrlForRedirect(): void {
  if (isClient()) {
    const currentPath = window.location.pathname + window.location.search
    if (!currentPath.startsWith("/auth/")) {
      sessionStorage.setItem("redirectAfterAuth", currentPath)
    }
  }
}

/**
 * Retrieves and clears the stored redirect URL
 */
export function getStoredRedirectUrl(): string | null {
  if (isClient()) {
    const redirectUrl = sessionStorage.getItem("redirectAfterAuth")
    sessionStorage.removeItem("redirectAfterAuth")
    return redirectUrl
  }
  return null
}

/**
 * Handles redirect with error recovery
 */
export function performRedirect(url: string, router: any, fallbackUrl = "/dashboard"): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const validUrl = validateRedirectUrl(url) || fallbackUrl
      router.push(validUrl)

      // Set a timeout to check if the redirect was successful
      const timeoutId = setTimeout(() => {
        console.error("Redirect timeout, using fallback")
        router.push(fallbackUrl)
        resolve(false)
      }, 3000)

      // Clear the timeout if the component unmounts or redirect succeeds
      const cleanup = () => {
        clearTimeout(timeoutId)
        resolve(true)
      }

      // Return the cleanup function
      return cleanup
    } catch (error) {
      console.error("Redirect error:", error)
      router.push(fallbackUrl)
      resolve(false)
      return () => {}
    }
  })
}
