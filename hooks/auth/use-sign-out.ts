"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export type SignOutOptions = {
  redirectTo?: string
  immediate?: boolean
}

export type SignOutState = {
  signOut: (options?: SignOutOptions) => Promise<{ error: AuthError | null }>
  loading: boolean
  error: AuthError | null
}

/**
 * Hook for handling sign-out operations
 * @returns Sign-out function and state
 */
export function useSignOut(): SignOutState {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const router = useRouter()

  const signOut = async (options?: SignOutOptions): Promise<{ error: AuthError | null }> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError(signOutError)
        return { error: signOutError }
      }

      // Handle redirect if specified
      if (options?.redirectTo) {
        if (options.immediate) {
          router.push(options.redirectTo)
        } else {
          // Small delay to allow state to update
          setTimeout(() => {
            router.push(options.redirectTo!)
          }, 300)
        }
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

  return { signOut, loading, error }
}
