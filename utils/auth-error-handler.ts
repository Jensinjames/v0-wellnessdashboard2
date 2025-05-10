type AuthErrorContext = "sign-in" | "sign-up" | "sign-out" | "reset-password" | "email-verification"

/**
 * Handles authentication errors and returns user-friendly error messages
 */
export function handleAuthError(error: Error, context: AuthErrorContext = "sign-in"): string {
  const errorMessage = error.message.toLowerCase()

  // Network errors
  if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("timeout")) {
    return "Network error. Please check your internet connection and try again."
  }

  // Rate limiting
  if (errorMessage.includes("too many requests") || errorMessage.includes("rate limit")) {
    return "Too many attempts. Please try again later."
  }

  // Database errors
  if (
    errorMessage.includes("database error") ||
    errorMessage.includes("db error") ||
    errorMessage.includes("permission denied")
  ) {
    if (context === "sign-in") {
      return "Database error granting user. Please try again or use demo mode."
    }
    return "Database error. Please try again later."
  }

  // Context-specific errors
  switch (context) {
    case "sign-in":
      if (errorMessage.includes("invalid login") || errorMessage.includes("invalid credentials")) {
        return "Invalid email or password. Please try again."
      }
      if (errorMessage.includes("email not confirmed")) {
        return "Please verify your email before signing in. Check your inbox for a verification link."
      }
      break

    case "sign-up":
      if (errorMessage.includes("already registered")) {
        return "This email is already registered. Try signing in instead."
      }
      if (errorMessage.includes("password")) {
        return "Password is too weak. Please use a stronger password."
      }
      break

    case "reset-password":
      if (errorMessage.includes("user not found")) {
        return "No account found with this email address."
      }
      break

    case "email-verification":
      if (errorMessage.includes("expired")) {
        return "Verification link has expired. Please request a new one."
      }
      if (errorMessage.includes("invalid")) {
        return "Invalid verification link. Please request a new one."
      }
      break

    default:
      break
  }

  // Default error messages
  return error.message
}
