"use client"

import { useState } from "react"
import type { AuthError } from "@supabase/supabase-js"
import { getSupabaseClient, getAuthConfig } from "."

interface SignUpCredentials {
  email: string
  password: string
  metadata?: Record<string, any>
}

interface UseSignUpReturn {
  signUp: (credentials: SignUpCredentials) => Promise<{
    error: AuthError | null
    success: boolean
    emailConfirmationSent: boolean
  }>
  loading: boolean
  error: AuthError | null
}

/**
 * Hook for handling user registration
 */
export function useSignUp(): UseSignUpReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const signUp = async (credentials: SignUpCredentials) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const config = getAuthConfig()

      const { error, data } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${config.redirectUrl}`,
          data: credentials.metadata || {},
        },
      })

      if (error) {
        setError(error)
        return {
          error,
          success: false,
          emailConfirmationSent: false,
        }
      }

      // Check if email confirmation was sent
      const emailConfirmationSent = !!data.user && data.user.identities?.length === 0

      return {
        error: null,
        success: true,
        emailConfirmationSent,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        error: authError,
        success: false,
        emailConfirmationSent: false,
      }
    } finally {
      setLoading(false)
    }
  }

  return { signUp, loading, error }
}
