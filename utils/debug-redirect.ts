/**
 * Debug utility for tracking redirect paths
 * This can be used to log and diagnose redirect issues
 */

// Enable in development only
const DEBUG_REDIRECTS = process.env.NODE_ENV === "development"

/**
 * Log redirect information with consistent formatting
 */
export function logRedirect(source: string, path: string, reason: string, extraInfo?: Record<string, any>) {
  if (!DEBUG_REDIRECTS) return

  console.group(`🔄 Redirect [${source}]`)
  console.log(`Path: ${path}`)
  console.log(`Reason: ${reason}`)

  if (extraInfo) {
    console.log("Additional Info:")
    Object.entries(extraInfo).forEach(([key, value]) => {
      console.log(`  ${key}: `, value)
    })
  }

  // Add stack trace in development for easier debugging
  console.log("Stack trace:")
  console.trace()

  console.groupEnd()
}

/**
 * Validate and log a redirect path
 * @returns Whether the path is valid
 */
export function validateAndLogRedirectPath(source: string, path: string): boolean {
  if (!path) {
    logRedirect(source, "empty", "Empty path provided")
    return false
  }

  // Basic validation
  if (!path.startsWith("/")) {
    logRedirect(source, path, "Path does not start with /")
    return false
  }

  if (path.includes("://") || path.startsWith("//")) {
    logRedirect(source, path, "Path contains protocol or is malformed")
    return false
  }

  // Special case for root path
  if (path === "/") {
    logRedirect(source, path, "Root path - will be redirected to /dashboard")
    return true
  }

  // Path is valid
  logRedirect(source, path, "Valid redirect path")
  return true
}

/**
 * Get a safe redirect URL
 */
export function getSafeRedirectUrl(source: string, path: string, defaultPath = "/dashboard"): string {
  const isValid = validateAndLogRedirectPath(source, path)

  if (!isValid) {
    logRedirect(source, path, `Invalid path, using default: ${defaultPath}`)
    return defaultPath
  }

  // Special case for root path
  if (path === "/") {
    logRedirect(source, path, "Root path redirected to dashboard")
    return defaultPath
  }

  return path
}
