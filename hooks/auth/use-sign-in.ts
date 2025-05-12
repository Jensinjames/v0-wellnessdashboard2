"use client"

import { useState } from "react"
import type { AuthError } from "@supabase/supabase-js"
import { getSupabaseClient, getAuthConfig } from "."

interface SignInCredentials {
  email: string
  password: string
}

interface UseSignInReturn {
  signIn: (credentials: SignInCredentials) => Promise<{
    error: AuthError | null
    success: boolean
  }>
  loading: boolean
  error: AuthError | null
}

/**
 * Hook for handling user sign-in
 */
export function useSignIn(): UseSignInReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const signIn = async (credentials: SignInCredentials) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const config = getAuthConfig()

      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        setError(error)
        return { error, success: false }
      }

      return { error: null, success: true }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { error: authError, success: false }
    } finally {
      setLoading(false)
    }
  }

  return { signIn, loading, error }
}
