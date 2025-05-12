"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

export type PasswordResetRequestState = {
  requestPasswordReset: (email: string) => Promise<{ error: AuthError | null }>
  loading: boolean
  error: AuthError | null
}

export type PasswordUpdateState = {
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
  loading: boolean
  error: AuthError | null
}

/**
 * Hook for requesting a password reset
 * @returns Password reset request function and state
 */
export function usePasswordResetRequest(): PasswordResetRequestState {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const requestPasswordReset = async (email: string): Promise<{ error: AuthError | null }> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      if (resetError) {
        setError(resetError)
        return { error: resetError }
      }

      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  return { requestPasswordReset, loading, error }
}

/**
 * Hook for updating password after reset
 * @returns Password update function and state
 */
export function usePasswordUpdate(): PasswordUpdateState {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError)
        return { error: updateError }
      }

      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  return { updatePassword, loading, error }
}
