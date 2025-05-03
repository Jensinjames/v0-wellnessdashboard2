import { toast } from "@/hooks/use-toast"
import type { AuthError } from "@supabase/supabase-js"
import { supabase } from "./supabase"

export type AuthErrorType =
  | "SESSION_MISSING"
  | "SESSION_EXPIRED"
  | "INVALID_REFRESH_TOKEN"
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "UNKNOWN"

export interface AuthErrorDetails {
  type: AuthErrorType
  message: string
  originalError?: Error | AuthError
  retry?: () => Promise<void>
}

export async function handleAuthError(error: unknown): Promise<AuthErrorDetails> {
  // Default error details
  let errorDetails: AuthErrorDetails = {
    type: "UNKNOWN",
    message: "An authentication error occurred. Please try logging in again.",
    originalError: error as Error,
  }

  // Handle Supabase AuthError
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    if (errorMessage.includes("auth session missing")) {
      errorDetails = {
        type: "SESSION_MISSING",
        message: "Your login session is missing. Please sign in again.",
        originalError: error,
      }
    } else if (errorMessage.includes("expired") || errorMessage.includes("invalid jwt")) {
      errorDetails = {
        type: "SESSION_EXPIRED",
        message: "Your session has expired. Please sign in again.",
        originalError: error,
      }
    } else if (errorMessage.includes("refresh token")) {
      errorDetails = {
        type: "INVALID_REFRESH_TOKEN",
        message: "Unable to refresh your session. Please sign in again.",
        originalError: error,
      }
    } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      errorDetails = {
        type: "NETWORK_ERROR",
        message: "Network error. Please check your connection and try again.",
        originalError: error,
      }
    } else if (errorMessage.includes("unauthorized") || errorMessage.includes("not authorized")) {
      errorDetails = {
        type: "UNAUTHORIZED",
        message: "You're not authorized to perform this action. Please sign in again.",
        originalError: error,
      }
    }
  }

  // Log the error for debugging
  console.error("Auth error:", errorDetails.type, errorDetails.originalError)

  return errorDetails
}

export async function handleSessionError(error: AuthErrorDetails): Promise<boolean> {
  // Show user-friendly error message
  toast({
    title: "Authentication Error",
    description: error.message,
    variant: "destructive",
  })

  // For session-related errors, attempt to sign out and redirect to login
  if (
    error.type === "SESSION_MISSING" ||
    error.type === "SESSION_EXPIRED" ||
    error.type === "INVALID_REFRESH_TOKEN" ||
    error.type === "UNAUTHORIZED"
  ) {
    try {
      // Sign out the user
      await supabase.auth.signOut()

      // Redirect will happen via AuthGuard or middleware
      return true
    } catch (signOutError) {
      console.error("Error during sign out:", signOutError)
      // Force reload the page to clear state
      window.location.href = "/login"
      return true
    }
  }

  return false
}
