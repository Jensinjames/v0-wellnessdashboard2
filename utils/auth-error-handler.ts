export function handleAuthError(error: any, operation: string): string {
  console.error(`Authentication error during ${operation}:`, error)

  // Handle rate limiting
  if (error.status === 429 || error.message?.includes("Too Many Requests")) {
    return "Too many requests. Please try again in a moment."
  }

  // Handle specific error codes
  if (error.status === 400) {
    if (error.message?.includes("Email already registered")) {
      return "This email is already registered. Please sign in instead."
    }
    if (error.message?.includes("Invalid login credentials")) {
      return "Invalid email or password. Please try again."
    }
  }

  // Handle network errors
  if (error.message?.includes("fetch failed") || error.message?.includes("network")) {
    return "Network error. Please check your internet connection and try again."
  }

  // Default error message
  return error.message || `An error occurred during ${operation}. Please try again.`
}
