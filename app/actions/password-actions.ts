"use server"

import { createServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

/**
 * Server action to request a password reset
 * This provides a more robust approach than client-side reset
 */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string

  if (!email || !email.includes("@")) {
    return {
      success: false,
      error: "Please enter a valid email address",
    }
  }

  // Check if we're in a preview environment
  const isPreviewEnv = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"

  // In preview environments, just return success without calling Supabase
  if (isPreviewEnv) {
    return {
      success: true,
      environmentIssue: true,
      message: "Preview mode: No email sent",
    }
  }

  try {
    // Get the base URL for redirects
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"

    // Create the redirect URL
    const redirectTo = `${baseUrl}/auth/reset-password/confirm`

    console.log("Password reset request for:", email)
    console.log("Using redirect URL:", redirectTo)

    const supabase = createServerClient()

    // Try to call the resetPasswordForEmail method with error handling
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        console.error("Supabase password reset error:", error)
        return {
          success: false,
          error: error.message || "Failed to send reset email",
        }
      }

      return {
        success: true,
      }
    } catch (supabaseError: any) {
      // Handle specific Supabase errors
      console.error("Caught Supabase error:", supabaseError)

      // Check if this is a JSON parsing error
      if (supabaseError.message && supabaseError.message.includes("not valid JSON")) {
        console.log("JSON parsing error detected, likely an issue with the Supabase response")

        // This is likely an environment issue, so we'll return a more helpful message
        return {
          success: false,
          error: "Password reset is not available in this environment. Please try in production.",
          environmentIssue: true,
        }
      }

      return {
        success: false,
        error: supabaseError.message || "An error occurred with the authentication service",
      }
    }
  } catch (error: any) {
    console.error("Unexpected error in server-side password reset:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    }
  }
}

/**
 * Server action to update a user's password
 */
export async function updateUserPassword(formData: FormData) {
  const password = formData.get("password") as string

  if (!password || password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters",
    }
  }

  try {
    const supabase = createServerClient()

    // Update the user's password
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      console.error("Server-side password update error:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Redirect to login page on success
    redirect("/auth/login?reset=success")
  } catch (error: any) {
    console.error("Unexpected error in server-side password update:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    }
  }
}
