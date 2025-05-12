"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

export type PasswordResetState = {
  loading: boolean
  success: boolean
  error: AuthError | null
  sessionValid: boolean
}

export function usePasswordReset() {
  const [state, setState] = useState<PasswordResetState>({
    loading: false,
    success: false,
    error: null,
    sessionValid: false,
  })

  // Request password reset email
  const requestReset = async (email: string) => {
    try {
      setState({ ...state, loading: true, error: null })
      const supabase = createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      if (error) {
        setState({ ...state, loading: false, error, success: false })
        return { success: false, error }
      }

      setState({ ...state, loading: false, success: true, error: null })
      return { success: true, error: null }
    } catch (err) {
      console.error("Password reset request error:", err)
      const error = err as AuthError
      setState({ ...state, loading: false, error, success: false })
      return { success: false, error }
    }
  }

  return {
    requestReset,
    loading: state.loading,
    success: state.success,
    error: state.error,
  }
}

export function usePasswordUpdate() {
  const [state, setState] = useState<PasswordResetState>({
    loading: false,
    success: false,
    error: null,
    sessionValid: false,
  })

  // Validate the current session for password reset
  const validateSession = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }))
      const supabase = createClient()

      // Check if we have an active session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !sessionData.session) {
        setState((prev) => ({
          ...prev,
          loading: false,
          sessionValid: false,
          error:
            sessionError ||
            ({
              message: "No active session found. Your password reset link may have expired.",
              name: "SessionError",
              status: 401,
            } as AuthError),
        }))
        return { valid: false, error: sessionError }
      }

      setState((prev) => ({ ...prev, loading: false, sessionValid: true, error: null }))
      return { valid: true, error: null }
    } catch (err) {
      console.error("Session validation error:", err)
      const error = err as AuthError
      setState((prev) => ({ ...prev, loading: false, sessionValid: false, error }))
      return { valid: false, error }
    }
  }

  // Update password with the new one
  const updatePassword = async (newPassword: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const supabase = createClient()

      // First validate the session
      const { valid, error: validationError } = await validateSession()

      if (!valid) {
        return { success: false, error: validationError }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setState((prev) => ({ ...prev, loading: false, error, success: false }))
        return { success: false, error }
      }

      setState((prev) => ({ ...prev, loading: false, success: true, error: null }))
      return { success: true, error: null }
    } catch (err) {
      console.error("Password update error:", err)
      const error = err as AuthError
      setState((prev) => ({ ...prev, loading: false, error, success: false }))
      return { success: false, error }
    }
  }

  return {
    updatePassword,
    validateSession,
    loading: state.loading,
    success: state.success,
    error: state.error,
    sessionValid: state.sessionValid,
  }
}
