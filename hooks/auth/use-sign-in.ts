"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"

type SignInCredentials = {
  email: string
  password: string
  rememberMe?: boolean
}

type SignInResult = {
  success: boolean
  error: AuthError | null
  redirectTo: string | null
  emailVerificationRequired?: boolean
}

export function useSignIn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)

  const signIn = async (credentials: SignInCredentials, redirectTo = "/dashboard"): Promise<SignInResult> => {
    setLoading(true)
    setError(null)
    setIsEmailVerificationError(false)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (signInError) {
        setError(signInError)

        // Check if this is an email verification error
        if (signInError.message.includes("Email not confirmed") || signInError.message.includes("Email not verified")) {
          setIsEmailVerificationError(true)
          return {
            success: false,
            error: signInError,
            redirectTo: null,
            emailVerificationRequired: true,
          }
        }

        return {
          success: false,
          error: signInError,
          redirectTo: null,
        }
      }

      return {
        success: true,
        error: null,
        redirectTo,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
        redirectTo: null,
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    signIn,
    loading,
    error,
    isEmailVerificationError,
  }
}
