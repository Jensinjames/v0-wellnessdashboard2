"use client"

import { useState } from "react"
import type { AuthError } from "@supabase/supabase-js"
import { getSupabaseClient } from "."

interface UseSignOutReturn {
  signOut: () => Promise<{
    error: AuthError | null
    success: boolean
  }>
  loading: boolean
  error: AuthError | null
}

/**
 * Hook for handling user sign-out
 */
export function useSignOut(): UseSignOutReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const signOut = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.signOut()

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

  return { signOut, loading, error }
}
