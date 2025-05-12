"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

// Hook for requesting a password reset
export function usePasswordResetRequest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const requestPasswordReset = async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      if (resetError) {
        setError(resetError)
        return { error: resetError, sent: false }
      }

      return { error: null, sent: true }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { error: authError, sent: false }
    } finally {
      setLoading(false)
    }
  }

  return {
    requestPasswordReset,
    loading,
    error,
  }
}

// Hook for updating password after reset
export function usePasswordUpdate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const updatePassword = async (newPassword: string) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError)
        return { success: false, error: updateError }
      }

      return { success: true, error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    updatePassword,
    loading,
    error,
  }
}
