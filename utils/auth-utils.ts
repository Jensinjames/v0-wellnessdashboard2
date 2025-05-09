/**
 * Authentication Utilities
 *
 * Helper functions for authentication-related operations
 */

/**
 * Checks if the current user is authenticated by validating the session
 * This is a client-side utility that can be used to verify authentication status
 */
export async function checkAuthentication(): Promise<{
  authenticated: boolean
  userId?: string
  error?: string
}> {
  try {
    // Call our session API endpoint
    const response = await fetch("/api/auth/session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Include credentials to send cookies
      credentials: "include",
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { authenticated: false }
      }

      const errorData = await response.json()
      return {
        authenticated: false,
        error: errorData.error || "Failed to verify authentication",
      }
    }

    const data = await response.json()
    return {
      authenticated: true,
      userId: data.userId,
    }
  } catch (error) {
    console.error("Error checking authentication:", error)
    return {
      authenticated: false,
      error: "Failed to check authentication status",
    }
  }
}

/**
 * Redirects to the login page with the current URL as the redirect target
 */
export function redirectToLogin(currentPath: string = window.location.pathname): void {
  const loginUrl = new URL("/auth/sign-in", window.location.origin)
  loginUrl.searchParams.set("redirectTo", currentPath)
  window.location.href = loginUrl.toString()
}

/**
 * Validates a redirect URL to ensure it's safe
 * Only allows relative URLs that start with / and are on the same origin
 */
export function validateRedirectUrl(url: string | null): string {
  if (!url) return "/dashboard"

  try {
    // Check if it's a relative URL (starts with /)
    if (url.startsWith("/")) {
      // Make sure it doesn't contain protocol-relative URLs
      if (!url.startsWith("//")) {
        return url
      }
    }

    // If we get here, the URL is not valid
    console.warn(`Invalid redirect URL: ${url}`)
    return "/dashboard"
  } catch (e) {
    console.error("Error validating redirect URL:", e)
    return "/dashboard"
  }
}
