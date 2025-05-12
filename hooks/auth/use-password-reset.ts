"use client"

import { useCallback } from "react"
import { resetPassword, updatePassword } from "@/app/actions/auth-actions"
import { useAuthState } from "./use-auth-state"

interface ResetPasswordResponse {
  success: boolean
  error?: string
}

export function usePasswordReset() {
  const [resetState, { setLoading: setResetLoading, setSuccess: setResetSuccess, setError: setResetError }] =
    useAuthState<ResetPasswordResponse>()

  const [updateState, { setLoading: setUpdateLoading, setSuccess: setUpdateSuccess, setError: setUpdateError }] =
    useAuthState<ResetPasswordResponse>()

  const sendResetLink = useCallback(
    async (email: string) => {
      setResetLoading()

      try {
        // Create form data for the server action
        const formData = new FormData()
        formData.append("email", email)

        // Call the server action
        const result = await resetPassword(formData)

        if (result.success) {
          setResetSuccess(result)
        } else {
          setResetError(result.error || "An unknown error occurred")
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        setResetError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [setResetLoading, setResetSuccess, setResetError],
  )

  const updateUserPassword = useCallback(
    async (newPassword: string) => {
      setUpdateLoading()

      try {
        // Create form data for the server action
        const formData = new FormData()
        formData.append("password", newPassword)

        // Call the server action
        const result = await updatePassword(formData)

        if (result.success) {
          setUpdateSuccess(result)
        } else {
          setUpdateError(result.error || "An unknown error occurred")
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        setUpdateError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [setUpdateLoading, setUpdateSuccess, setUpdateError],
  )

  return {
    sendResetLink,
    updateUserPassword,
    resetState: {
      isLoading: resetState.isLoading,
      isSuccess: resetState.isSuccess,
      isError: resetState.isError,
      error: resetState.error,
    },
    updateState: {
      isLoading: updateState.isLoading,
      isSuccess: updateState.isSuccess,
      isError: updateState.isError,
      error: updateState.error,
    },
  }
}
