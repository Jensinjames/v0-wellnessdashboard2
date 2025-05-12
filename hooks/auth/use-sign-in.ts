"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { User, AuthError } from "@supabase/supabase-js"

export type SignInCredentials = {
  email: string
  password: string
  rememberMe?: boolean
}

export type SignInResult = {
  user: User | null
  error: AuthError | null
  redirectTo?: string
}

export type SignInState = {
  signIn: (credentials: SignInCredentials, redirectTo?: string) => Promise<SignInResult>
  loading: boolean
  error: AuthError | null
}

/**
 * Hook for handling sign-in operations
 * @returns Sign-in function and state
 */
export function useSignIn(): SignInState {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const signIn = async (credentials: SignInCredentials, redirectTo?: string): Promise<SignInResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
        options: {
          redirectTo: redirectTo || undefined,
        },
      })

      if (signInError) {
        setError(signInError)
        return { user: null, error: signInError }
      }

      return {
        user: data.user,
        error: null,
        redirectTo,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { user: null, error: authError }
    } finally {
      setLoading(false)
    }
  }

  return { signIn, loading, error }
}
