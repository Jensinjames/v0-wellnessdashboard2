"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface SignUpCredentials {
  email: string
  password: string
}

interface SignUpResult {
  user: any | null
  error: string | null
  emailVerificationSent?: boolean
  fieldErrors?: Record<string, string>
}

export function useEdgeSignup() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const signUp = async (credentials: SignUpCredentials): Promise<SignUpResult> => {
    setIsLoading(true)

    try {
      // Call the server action instead of directly calling the Edge Function
      // This prevents exposing any sensitive information on the client
      const response = await fetch("/api/auth/edge-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors separately
        if (response.status === 400 && data.fieldErrors) {
          return {
            user: null,
            error: "Validation failed",
            fieldErrors: data.fieldErrors,
          }
        }

        throw new Error(data.error || "Signup failed")
      }

      return {
        user: data.user,
        error: null,
        emailVerificationSent: data.emailVerificationSent,
      }
    } catch (err: any) {
      console.error("Edge signup error:", err)

      // Network errors
      if (err.message?.includes("fetch") || err.message?.includes("network")) {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        })
      }

      return {
        user: null,
        error: err.message || "An unexpected error occurred",
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { signUp, isLoading }
}
