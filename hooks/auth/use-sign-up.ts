"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { User, AuthError } from "@supabase/supabase-js"

export type SignUpCredentials = {
  email: string
  password: string
  name?: string
  metadata?: Record<string, any>
}

export type SignUpResult = {
  user: User | null
  error: AuthError | null
  emailConfirmationSent: boolean
}

export type SignUpState = {
  signUp: (credentials: SignUpCredentials) => Promise<SignUpResult>
  loading: boolean
  error: AuthError | null
}

/**
 * Hook for handling sign-up operations
 * @returns Sign-up function and state
 */
export function useSignUp(): SignUpState {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const signUp = async (credentials: SignUpCredentials): Promise<SignUpResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Prepare user metadata
      const metadata: Record<string, any> = {
        ...(credentials.metadata || {}),
      }

      // Add name to metadata if provided
      if (credentials.name) {
        metadata.name = credentials.name
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: Object.keys(metadata).length > 0 ? metadata : undefined,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError)
        return {
          user: null,
          error: signUpError,
          emailConfirmationSent: false,
        }
      }

      // Check if email confirmation was sent
      const emailConfirmationSent = !data.session

      return {
        user: data.user,
        error: null,
        emailConfirmationSent,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        user: null,
        error: authError,
        emailConfirmationSent: false,
      }
    } finally {
      setLoading(false)
    }
  }

  return { signUp, loading, error }
}
