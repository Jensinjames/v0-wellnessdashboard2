"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/app/actions/auth-actions"
import { useAuthState } from "./use-auth-state"

interface SignUpCredentials {
  email: string
  password: string
  name: string
  redirectTo?: string
}

interface SignUpResponse {
  success: boolean
  error?: string
  message?: string
}

export function useSignUp() {
  const router = useRouter()
  const [state, { setLoading, setSuccess, setError }] = useAuthState<SignUpResponse>()

  const register = useCallback(
    async (credentials: SignUpCredentials) => {
      setLoading()

      try {
        // Create form data for the server action
        const formData = new FormData()
        formData.append("email", credentials.email)
        formData.append("password", credentials.password)
        formData.append("name", credentials.name)

        if (credentials.redirectTo) {
          formData.append("redirectTo", credentials.redirectTo)
        }

        // Call the server action
        const result = await signUp(formData)

        if (result.success) {
          setSuccess(result)

          // If there's a message, we're likely in email confirmation mode
          if (result.message) {
            // Stay on the page and show success message
            return result
          }

          // Otherwise, redirect to the profile page
          setTimeout(() => {
            router.push("/profile")
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
    register,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    isError: state.isError,
    error: state.error,
    message: state.data?.message,
  }
}
