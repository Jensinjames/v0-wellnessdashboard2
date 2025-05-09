"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { handleAuthError } from "@/utils/auth-error-handler"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get the Supabase client - this might return a Promise
      const supabaseClientOrPromise = getSupabaseClient()

      // Ensure we have a resolved client
      const supabase =
        supabaseClientOrPromise instanceof Promise ? await supabaseClientOrPromise : supabaseClientOrPromise

      // Check if the client and auth are properly initialized
      if (!supabase || !supabase.auth) {
        setError("Authentication service is not available. Please try again later.")
        return
      }

      // Log the attempt for debugging
      console.log(`Attempting password reset for email: ${email} (Attempt ${retryCount + 1})`)

      // Add a small delay to prevent rate limiting
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
      }

      const { error: resetError, data } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      // Log the response for debugging
      console.log("Password reset response:", resetError ? "Error" : "Success", data)

      if (resetError) {
        // If we get a rate limit error, we can retry with backoff
        if (resetError.message?.includes("rate limit") || resetError.status === 429) {
          if (retryCount < 2) {
            setRetryCount((prev) => prev + 1)
            setError(`Rate limited. Retrying automatically in ${retryCount + 1} seconds...`)
            setTimeout(() => handleSubmit(e), 1000 * (retryCount + 1))
            return
          }
        }

        // Handle other errors
        setError(handleAuthError(resetError, "password-reset"))
        return
      }

      // Reset retry count on success
      setRetryCount(0)
      setSuccess(true)
    } catch (err: any) {
      console.error("Password reset error:", err)

      // Check if it's a network error
      if (err.message?.includes("Failed to fetch") || err.message?.includes("Network Error")) {
        setError("Network error. Please check your internet connection and try again.")
      } else {
        setError(handleAuthError(err, "password-reset"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Demo mode option for testing
  const handleDemoMode = (e: React.MouseEvent) => {
    e.preventDefault()
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert variant="success" className="bg-green-50 text-green-700 border-green-200">
          <AlertDescription>
            Password reset instructions have been sent to your email. Please check your inbox and follow the
            instructions to reset your password.
          </AlertDescription>
        </Alert>
        <div className="text-center text-sm">
          <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-500">
            Return to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          placeholder="Enter your email address"
          className="w-full"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
      </Button>

      {process.env.NODE_ENV === "development" && (
        <Button type="button" variant="outline" className="w-full mt-2" onClick={handleDemoMode}>
          Demo Mode: Skip Email
        </Button>
      )}

      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-500">
          Sign in
        </Link>
      </div>
    </form>
  )
}
