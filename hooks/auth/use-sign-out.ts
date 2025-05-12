"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/app/actions/auth-actions"
import { useAuthState } from "./use-auth-state"

interface SignOutResponse {
  success: boolean
  error?: string
}

export function useSignOut() {
  const router = useRouter()
  const [state, { setLoading, setSuccess, setError }] = useAuthState<SignOutResponse>()

  const logout = useCallback(async () => {
    setLoading()

    try {
      // Call the server action
      await signOut()

      // The server action redirects, but we'll set success state just in case
      setSuccess({ success: true })

      // Force a refresh of the router
      router.refresh()

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [router, setLoading, setSuccess, setError])

  return {
    logout,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    isError: state.isError,
    error: state.error,
  }
}
