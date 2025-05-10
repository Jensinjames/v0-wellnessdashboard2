"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { handleAuthError } from "@/utils/auth-error-handler"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isValidEmail, sanitizeEmail } from "@/utils/auth-validation"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [clientInitialized, setClientInitialized] = useState(false)

  // Validation state
  const [touched, setTouched] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)

  // Check if Supabase client is available
  useEffect(() => {
    const checkClient = async () => {
      try {
        const client = await getSupabaseClient()
        setClientInitialized(!!client && !!client.auth)
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err)
        setClientInitialized(false)
      }
    }

    checkClient()
  }, [])

  // Validate email whenever it changes
  useEffect(() => {
    if (!touched) return

    if (!email.trim()) {
      setValidationError("Email is required")
      setIsValid(false)
    } else if (!isValidEmail(email)) {
      setValidationError("Please enter a valid email address")
      setIsValid(false)
    } else {
      setValidationError(null)
      setIsValid(true)
    }
  }, [email, touched])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (!touched) setTouched(true)
  }

  const handleBlur = () => {
    if (!touched) setTouched(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate before submission
    if (!email.trim()) {
      setValidationError("Email is required")
      setTouched(true)
      setIsValid(false)
      return
    }

    if (!isValidEmail(email)) {
      setValidationError("Please enter a valid email address")
      setTouched(true)
      setIsValid(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check if client is initialized
      if (!clientInitialized) {
        setError("Authentication service is not available. Please try again later.")
        setIsLoading(false)
        return
      }

      // Sanitize email input
      const sanitizedEmail = sanitizeEmail(email)

      // Get the Supabase client - this might return a Promise
      const supabaseClientOrPromise = getSupabaseClient()

      // Ensure we have a resolved client
      const supabase =
        supabaseClientOrPromise instanceof Promise ? await supabaseClientOrPromise : supabaseClientOrPromise

      // Double-check if the client and auth are properly initialized
      if (!supabase || !supabase.auth) {
        setError("Authentication service is not available. Please try again later.")
        return
      }

      // Log the attempt for debugging
      console.log(`Attempting password reset for email: ${sanitizedEmail} (Attempt ${retryCount + 1})`)

      // Add a small delay to prevent rate limiting
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
      }

      // Use try/catch specifically for the resetPasswordForEmail call
      try {
        const { error: resetError, data } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        // Log the response for debugging
        console.log("Password reset response:", resetError ? "Error" : "Success", data)

        if (resetError) {
          throw resetError
        }

        // Reset retry count on success
        setRetryCount(0)
        setSuccess(true)
      } catch (resetError: any) {
        console.error("Password reset specific error:", resetError)

        // If we get a rate limit error, we can retry with exponential backoff
        if (
          resetError.message?.includes("rate limit") ||
          resetError.status === 429 ||
          resetError.message?.includes("Too Many Requests")
        ) {
          if (retryCount < 3) {
            setRetryCount((prev) => prev + 1)
            const waitTime = Math.pow(2, retryCount)
            setError(`Rate limited. Retrying automatically in ${waitTime} seconds...`)
            setTimeout(() => handleSubmit(e), 1000 * waitTime)
            return
          } else {
            setError("Too many attempts. Please try again later or contact support.")
            return
          }
        }

        // Handle email sending errors specifically
        if (resetError.message?.includes("sending recovery email") || resetError.message?.includes("send email")) {
          setError(
            "Unable to send recovery email. Please verify your email address or try the alternative options below.",
          )
          return
        }

        // Handle other errors
        setError(handleAuthError(resetError, "password-reset"))
      }
    } catch (err: any) {
      console.error("Password reset general error:", err)

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

  // Alternative options for when email sending fails
  const renderAlternativeOptions = () => {
    if (!error || !error.includes("Unable to send recovery email")) return null

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Alternative Options:</h3>
        <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>Check your spam/junk folder for previous reset emails</li>
          <li>Try a different email address if you have access to multiple</li>
          <li>
            <Link href="/auth/sign-in" className="underline hover:text-blue-500">
              Return to sign in
            </Link>{" "}
            and try to sign in with your social account if you used one
          </li>
          <li>
            <Link href="/contact" className="underline hover:text-blue-500">
              Contact support
            </Link>{" "}
            for assistance with account recovery
          </li>
        </ul>
      </div>
    )
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
        <div className="text-sm bg-blue-50 p-3 rounded-md border border-blue-100">
          <p className="text-blue-700 mb-2">
            <strong>Tip:</strong> If you don't see the email in your inbox, please:
          </p>
          <ul className="text-blue-600 list-disc pl-5 space-y-1">
            <li>Check your spam or junk folder</li>
            <li>Wait a few minutes as email delivery may be delayed</li>
            <li>Make sure you entered the correct email address</li>
          </ul>
        </div>
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

      {renderAlternativeOptions()}

      <div className="space-y-2">
        <Label htmlFor="email" className="flex justify-between">
          <span>Email</span>
          {touched && validationError && (
            <span className="text-red-500 text-xs font-normal" aria-live="polite">
              {validationError}
            </span>
          )}
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={handleInputChange}
          onBlur={handleBlur}
          required
          disabled={isLoading}
          placeholder="Enter your email address"
          className={`w-full ${touched && validationError ? "border-red-500 focus:ring-red-500" : ""}`}
          aria-invalid={touched && !!validationError}
          aria-describedby={validationError ? "email-error" : undefined}
        />
        {touched && validationError && (
          <div id="email-error" className="sr-only">
            {validationError}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || (touched && !isValid) || !clientInitialized}>
        {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
      </Button>

      {!clientInitialized && (
        <div className="text-amber-600 text-sm text-center">Authentication service is initializing. Please wait...</div>
      )}

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
