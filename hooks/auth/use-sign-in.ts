"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/app/actions/auth-actions"
import { useAuthState } from "./use-auth-state"

interface SignInCredentials {
  email: string
  password: string
  redirectTo?: string
}

interface SignInResponse {
  success: boolean
  error?: string
  redirectTo?: string
}

export function useSignIn() {
  const router = useRouter()
  const [state, { setLoading, setSuccess, setError }] = useAuthState<SignInResponse>()
  const [rememberMe, setRememberMe] = useState(false)

  const login = useCallback(
    async (credentials: SignInCredentials) => {
      setLoading()

      try {
        // Create form data for the server action
        const formData = new FormData()
        formData.append("email", credentials.email)
        formData.append("password", credentials.password)

        if (credentials.redirectTo) {
          formData.append("redirectTo", credentials.redirectTo)
        }

        // Call the server action
        const result = await signIn(formData)

        if (result.success) {
          setSuccess(result)

          // Add a small delay before redirecting to ensure the session is set
          setTimeout(() => {
            router.push(result.redirectTo || "/profile")
            router.refresh()
          }, 300)
        } else {
          setError(result.error || "An unknown error occurred")
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [router, setLoading, setSuccess, setError],
  )

  return {
    login,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    isError: state.isError,
    error: state.error,
    rememberMe,
    setRememberMe,
  }
}
