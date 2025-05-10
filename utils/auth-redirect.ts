/**
 * Authentication Redirect Utilities
 *
 * Handles parsing, validation, and storage of redirect paths and authentication tokens
 */

// Token parameter name used by the application
const TOKEN_PARAM = "__v0_token"

/**
 * Extracts and validates a redirect path from URL parameters
 *
 * @param redirectParam - The raw redirectTo parameter from URL
 * @returns A clean, validated redirect path
 */
export function extractRedirectPath(redirectParam: string | null): string {
  if (!redirectParam) return "/dashboard"

  try {
    // Decode the URL parameter
    const decodedParam = decodeURIComponent(redirectParam)

    // Check if the redirect parameter itself contains query parameters
    const urlParts = decodedParam.split("?")
    const path = urlParts[0]

    // Special case for root path
    if (path === "/") {
      return "/dashboard"
    }

    // Validate the path
    if (isValidRedirectPath(path)) {
      return path
    }

    console.warn(`Invalid redirect path detected: ${path}`)
    return "/dashboard"
  } catch (error) {
    console.error("Error processing redirect path:", error)
    return "/dashboard"
  }
}

/**
 * Validates if a path is safe for redirection
 *
 * @param path - The path to validate
 * @returns Whether the path is valid for redirection
 */
export function isValidRedirectPath(path: string): boolean {
  if (!path) return false

  // Path must start with / and not contain protocol indicators
  if (!path.startsWith("/")) return false
  if (path.startsWith("//")) return false
  if (path.includes("://")) return false

  // Root path is valid
  if (path === "/") return true

  // Allow specific application paths
  const allowedPrefixes = ["/", "/app", "/dashboard", "/profile", "/settings", "/goals", "/categories"]
  return allowedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * Extracts authentication token from URL parameters
 *
 * @param url - The full URL or query string
 * @returns The extracted token or null if not found
 */
export function extractAuthToken(url: string): string | null {
  try {
    const urlObj = new URL(url.includes("http") ? url : `http://example.com${url}`)
    return urlObj.searchParams.get(TOKEN_PARAM)
  } catch (error) {
    // Try to extract from query string directly
    const regex = new RegExp(`[?&]${TOKEN_PARAM}=([^&]*)`)
    const match = regex.exec(url)
    return match ? decodeURIComponent(match[1]) : null
  }
}

/**
 * Stores the redirect path in session storage
 *
 * @param path - The path to store
 */
export function storeRedirectPath(path: string): void {
  if (typeof window !== "undefined" && isValidRedirectPath(path)) {
    sessionStorage.setItem("authRedirectPath", path)
  }
}

/**
 * Retrieves the stored redirect path
 *
 * @returns The stored path or default if none exists
 */
export function getStoredRedirectPath(): string {
  if (typeof window !== "undefined") {
    const storedPath = sessionStorage.getItem("authRedirectPath")
    if (storedPath) {
      // Clear the stored path to prevent reuse
      sessionStorage.removeItem("authRedirectPath")
      return storedPath
    }
  }
  return "/dashboard"
}

/**
 * Creates a clean login URL with redirect parameter
 *
 * @param redirectPath - The path to redirect to after login
 * @returns A properly formatted login URL
 */
export function createLoginUrl(redirectPath: string): string {
  const encodedPath = encodeURIComponent(redirectPath)
  return `/auth/sign-in?redirectTo=${encodedPath}`
}

/**
 * Handles token-based authentication redirection
 *
 * @param token - The authentication token
 * @param redirectPath - The path to redirect to after processing the token
 * @returns Whether the token was processed
 */
export async function handleAuthToken(token: string, redirectPath: string): Promise<boolean> {
  if (!token) return false

  try {
    // Store the redirect path for after token processing
    storeRedirectPath(redirectPath)

    // Make an API call to process the token
    const response = await fetch("/api/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      throw new Error("Failed to process authentication token")
    }

    return true
  } catch (error) {
    console.error("Error handling authentication token:", error)
    return false
  }
}

/**
 * Parses and processes a full URL with potential token and redirect parameters
 *
 * @param url - The full URL to process
 * @returns An object with the extracted token and redirect path
 */
export function parseAuthUrl(url: string): { token: string | null; redirectPath: string } {
  // Extract the token if present
  const token = extractAuthToken(url)

  // Parse the URL to get the redirectTo parameter
  let redirectPath = "/dashboard"
  try {
    const urlObj = new URL(url.includes("http") ? url : `http://example.com${url}`)
    const redirectParam = urlObj.searchParams.get("redirectTo")
    if (redirectParam) {
      redirectPath = extractRedirectPath(redirectParam)
    }
  } catch (error) {
    console.error("Error parsing URL:", error)
  }

  return { token, redirectPath }
}
