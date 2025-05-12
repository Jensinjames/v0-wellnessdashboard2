"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

type SignUpCredentials = {
  email: string
  password: string
  name?: string
  redirectTo?: string
}

type SignUpResult = {
  success: boolean
  error: AuthError | null
  emailConfirmationSent: boolean
  user: any | null
}

export function useSignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const signUp = async (credentials: SignUpCredentials): Promise<SignUpResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Determine the redirect URL for email confirmation
      const redirectTo = credentials.redirectTo || `${window.location.origin}/auth/callback`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name || "",
          },
          emailRedirectTo: redirectTo,
        },
      })

      if (signUpError) {
        setError(signUpError)
        return {
          success: false,
          error: signUpError,
          emailConfirmationSent: false,
          user: null,
        }
      }

      // Check if email confirmation is required
      const emailConfirmationSent = !data.session

      return {
        success: true,
        error: null,
        emailConfirmationSent,
        user: data.user,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
        emailConfirmationSent: false,
        user: null,
      }
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (resendError) {
        setError(resendError)
        return { error: resendError }
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

  return {
    signUp,
    resendVerificationEmail,
    loading,
    error,
  }
}
