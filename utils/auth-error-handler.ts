export function handleAuthError(error: any, operation: string): string {
  console.error(`Authentication error during ${operation}:`, error)

  // Handle undefined client or methods
  if (error.message?.includes("Cannot read properties of undefined")) {
    if (error.message.includes("resetPasswordForEmail")) {
      return "Authentication service is temporarily unavailable. Please try again in a moment."
    }
    return "Authentication service error. Please try again later."
  }

  // Handle JSON parsing errors (often from rate limiting)
  if (error instanceof SyntaxError && error.message.includes("Unexpected token")) {
    if (error.message.includes("Too Many R") || error.message.includes("429")) {
      return "Too many requests. Please try again in a moment."
    }
    return "Server returned an invalid response. Please try again later."
  }

  // Handle authentication errors
  if (error.message?.includes("Invalid login credentials") || error.status === 400) {
    if (operation === "sign-in") {
      return "Invalid email or password. Please try again or use demo mode."
    }
  }

  // Handle database errors
  if (error.message?.includes("Database error") || error.message?.includes("db error")) {
    return "Database error. Please try again later or contact support."
  }

  // Handle rate limiting
  if (
    error.status === 429 ||
    error.message?.includes("Too Many Requests") ||
    error.message?.includes("Too Many R") ||
    error.message?.includes("429") ||
    (error instanceof SyntaxError && error.message.includes("Unexpected token"))
  ) {
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
  if (
    error.message?.includes("Failed to fetch") ||
    error.message?.includes("Network Error") ||
    error.message?.includes("network")
  ) {
    return "Network error. Please check your internet connection and try again."
  }

  // Handle specific password reset errors
  if (operation === "password-reset") {
    if (error.message?.includes("sending recovery email")) {
      return "Unable to send recovery email. Please verify your email address or try again later."
    }
    if (error.message?.includes("User not found")) {
      // Don't reveal if an email exists or not for security reasons
      return "If your email is registered, you will receive password reset instructions shortly."
    }
    if (error.message?.includes("rate limit")) {
      return "Too many password reset attempts. Please try again later."
    }
  }

  // Default error message
  return error.message || `An error occurred during ${operation}. Please try again.`
}
