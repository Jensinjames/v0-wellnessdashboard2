"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase, refreshSession } from "@/lib/supabase"
import { handleAuthError, handleSessionError } from "@/lib/auth-error-handler"

export function useAuth() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to handle auth operations with error handling
  const handleAuthOperation = async <T,>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T | { error: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      return await operation()
    } catch (err) {
      const errorDetails = await handleAuthError(err)
      setError(errorDetails.message)

      // Handle session errors (will redirect if needed)
      await handleSessionError(errorDetails)

      return { error: errorDetails.message }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    return handleAuthOperation(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Check if email confirmation is required
      if (data.user && data.session) {
        // User is signed in immediately
        router.push("/dashboard")
        return { success: true }
      } else if (data.user && !data.session) {
        // Email confirmation is required
        return {
          success: true,
          message: "Please check your email for a confirmation link.",
        }
      }

      return { success: false, error: "Something went wrong during sign up." }
    }, "An error occurred during sign-up")
  }

  const signIn = async (email: string, password: string) => {
    return handleAuthOperation(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user && data.session) {
        router.push("/dashboard")
        return { success: true }
      }

      return { success: false, error: "Invalid login credentials" }
    }, "Invalid login credentials")
  }

  const signOut = async () => {
    return handleAuthOperation(async () => {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      router.push("/login")
      return { success: true }
    }, "An error occurred during sign-out")
  }

  const resetPassword = async (email: string) => {
    return handleAuthOperation(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        message: "Password reset instructions sent to your email.",
      }
    }, "Failed to send password reset email")
  }

  const updatePassword = async (newPassword: string) => {
    return handleAuthOperation(async () => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      return { success: true, message: "Password updated successfully." }
    }, "Failed to update password")
  }

  // Function to attempt session refresh
  const attemptSessionRefresh = async () => {
    return handleAuthOperation(async () => {
      const result = await refreshSession()

      if (!result.success) {
        throw new Error("Failed to refresh session")
      }

      return { success: true, message: "Session refreshed successfully" }
    }, "Failed to refresh your session")
  }

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    attemptSessionRefresh,
    isLoading,
    error,
  }
}
