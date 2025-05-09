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

  // Handle database errors - specifically the "Database error granting user" error
  if (
    error.message?.includes("Database error granting user") ||
    error.message?.includes("database error") ||
    error.message?.includes("Database error") ||
    error.message?.includes("db error") ||
    error.message?.includes("database connection") ||
    error.message?.includes("connection error") ||
    error.message?.includes("could not connect to database")
  ) {
    if (operation === "sign-in" || operation === "sign-up") {
      return "We encountered a temporary database issue. Please try again or use demo mode."
    }
    return "Database connection issue. Please try again in a moment."
  }

  // Handle authentication errors
  if (error.message?.includes("Invalid login credentials") || error.status === 400) {
    if (operation === "sign-in") {
      return "Invalid email or password. Please try again or use demo mode."
    }
  }

  // Handle email verification errors
  if (error.message?.includes("Email not confirmed") || error.message?.includes("verify your email")) {
    return "Please verify your email before signing in. Check your inbox for a verification link."
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

  // Handle session expiration
  if (error.message?.includes("JWT expired") || error.message?.includes("token is expired")) {
    return "Your session has expired. Please sign in again."
  }

  // Handle account lockout
  if (error.message?.includes("locked") || error.message?.includes("too many attempts")) {
    return "Your account has been temporarily locked due to too many failed attempts. Please try again later."
  }

  // Default error message
  return error.message || `An error occurred during ${operation}. Please try again.`
}
