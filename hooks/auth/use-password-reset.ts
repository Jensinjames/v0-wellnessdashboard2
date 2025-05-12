"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

export type PasswordResetState = {
  loading: boolean
  success: boolean
  error: AuthError | null
}

export function usePasswordReset() {
  const [state, setState] = useState<PasswordResetState>({
    loading: false,
    success: false,
    error: null,
  })

  // Request password reset email
  const requestReset = async (email: string) => {
    if (!email || typeof email !== "string") {
      const error = {
        message: "Please provide a valid email address",
        name: "InvalidEmailError",
        status: 400,
      } as AuthError

      setState({ loading: false, success: false, error })
      return { success: false, error }
    }

    try {
      setState({ loading: true, success: false, error: null })
      const supabase = createClient()

      // Validate Supabase client
      if (!supabase) {
        throw new Error("Failed to initialize Supabase client")
      }

      // Use absolute URL for redirectTo
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const redirectUrl = `${origin}/auth/reset-password/confirm`

      console.log("Sending password reset to:", email, "with redirect:", redirectUrl)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        console.error("Supabase resetPasswordForEmail error:", error)
        setState({ loading: false, success: false, error })
        return { success: false, error }
      }

      setState({ loading: false, success: true, error: null })
      return { success: true, error: null }
    } catch (err) {
      console.error("Password reset request error:", err)
      const error =
        (err as AuthError) ||
        ({
          message: "Failed to send password reset email. Please try again.",
          name: "ResetError",
          status: 500,
        } as AuthError)

      setState({ loading: false, success: false, error })
      return { success: false, error }
    }
  }

  return {
    requestReset,
    ...state,
  }
}

export function usePasswordUpdate() {
  const [state, setState] = useState<PasswordResetState & { sessionValid: boolean }>({
    loading: false,
    success: false,
    error: null,
    sessionValid: false,
  })

  // Update password with the new one
  const updatePassword = async (newPassword: string) => {
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      const error = {
        message: "Password must be at least 6 characters",
        name: "InvalidPasswordError",
        status: 400,
      } as AuthError

      setState({ ...state, loading: false, error, success: false })
      return { success: false, error }
    }

    try {
      setState({ ...state, loading: true, error: null })
      const supabase = createClient()

      // Validate Supabase client
      if (!supabase) {
        throw new Error("Failed to initialize Supabase client")
      }

      // Check if we have an active session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        setState({ ...state, loading: false, sessionValid: false, error: sessionError })
        return { success: false, error: sessionError }
      }

      if (!sessionData?.session) {
        const error = {
          message: "No active session. Your password reset link may have expired.",
          name: "SessionError",
          status: 401,
        } as AuthError

        setState({ ...state, loading: false, sessionValid: false, error })
        return { success: false, error }
      }

      setState({ ...state, sessionValid: true })

      // Now update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        console.error("Password update error:", error)
        setState({ ...state, loading: false, error, success: false })
        return { success: false, error }
      }

      setState({ ...state, loading: false, success: true, error: null })
      return { success: true, error: null }
    } catch (err) {
      console.error("Password update error:", err)
      const error =
        (err as AuthError) ||
        ({
          message: "Failed to update password. Please try again.",
          name: "UpdateError",
          status: 500,
        } as AuthError)

      setState({ ...state, loading: false, error, success: false })
      return { success: false, error }
    }
  }

  return {
    updatePassword,
    ...state,
  }
}
