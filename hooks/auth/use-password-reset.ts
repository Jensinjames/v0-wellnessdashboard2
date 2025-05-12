"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

type ResetPasswordResult = {
  success: boolean
  error: AuthError | null
}

export function usePasswordReset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const sendResetEmail = async (email: string): Promise<ResetPasswordResult> => {
    setLoading(true)
    setError(null)
    setResetEmailSent(false)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      if (resetError) {
        setError(resetError)
        return {
          success: false,
          error: resetError,
        }
      }

      setResetEmailSent(true)
      return {
        success: true,
        error: null,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
      }
    } finally {
      setLoading(false)
    }
  }

  const validateSession = useCallback(async (): Promise<ResetPasswordResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setError(sessionError)
        return {
          success: false,
          error: sessionError,
        }
      }

      return {
        success: true,
        error: null,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string): Promise<ResetPasswordResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError)
        return {
          success: false,
          error: updateError,
        }
      }

      return {
        success: true,
        error: null,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    sendResetEmail,
    updatePassword,
    validateSession,
    loading,
    error,
    resetEmailSent,
    sessionValid: error === null && !loading,
  }
}

export const usePasswordUpdate = usePasswordReset
