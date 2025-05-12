"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import type { AuthError } from "@supabase/supabase-js"

type SignOutOptions = {
  redirectTo?: string
}

export function useSignOut() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const router = useRouter()

  const signOut = async (options: SignOutOptions = {}) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError(signOutError)
        return { success: false, error: signOutError }
      }

      // Redirect if specified
      if (options.redirectTo) {
        router.push(options.redirectTo)
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
    signOut,
    loading,
    error,
  }
}
