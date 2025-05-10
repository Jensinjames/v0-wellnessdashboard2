"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { validateEmail } from "@/utils/auth-validation"
import { handleAuthError } from "@/utils/auth-error-handler"

export function EnhancedForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({})
  const [success, setSuccess] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    // Validate email
    if (!email) {
      setFieldErrors({ email: "Email is required" })
      setIsLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setFieldErrors({ email: "Please enter a valid email address" })
      setIsLoading(false)
      return
    }

    try {
      // Check if we're online before attempting password reset
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const errorInfo = handleAuthError({ message: "You appear to be offline" }, { operation: "password-reset" })
        setError(errorInfo.message)
        setIsLoading(false)
        return
      }

      console.log("Attempting to send password reset email to:", email)

      const { success, error: resetError } = await resetPassword(email)

      if (resetError) {
        console.error("Password reset error details:", resetError)

        // Check if it's a server error that might be temporary
        if (resetError.includes("temporarily unavailable") || resetError.includes("currently unavailable")) {
          setRetryCount((prev) => prev + 1)
          setError(`${resetError} (Attempt ${retryCount + 1})`)
        } else {
          const errorInfo = handleAuthError({ message: resetError }, { operation: "password-reset" })
          setError(errorInfo.message)
        }

        setIsLoading(false)
        return
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Caught exception during password reset:", err)
      const errorInfo = handleAuthError(err, { operation: "password-reset" })
      setError(errorInfo.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleSubmit(new Event("submit") as any)
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="rounded-md bg-green-50 p-4 text-sm text-green-700" role="status" aria-live="polite">
          <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
          <AlertTitle>Password Reset Email Sent</AlertTitle>
          <AlertDescription>
            Password reset instructions have been sent to your email.
            {process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development" && (
              <p className="mt-2 text-xs">
                <strong>Note:</strong> In development mode, check the console for the password reset link.
              </p>
            )}
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
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="forgot-password-heading">
      <h2 id="forgot-password-heading" className="sr-only">
        Forgot password form
      </h2>

      {error && (
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          <AlertTitle>Password Reset Failed</AlertTitle>
          <AlertDescription>
            {error}
            {error.includes("temporarily unavailable") || error.includes("currently unavailable") ? (
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={handleRetry} className="mt-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" aria-hidden="true" />
                      Retrying...
                    </>
                  ) : (
                    "Try Again"
                  )}
                </Button>
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" id="email-label">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          aria-labelledby="email-label"
          aria-required="true"
          autoComplete="email"
          aria-invalid={!!fieldErrors.email}
          aria-errormessage={fieldErrors.email ? "email-error" : undefined}
          className={fieldErrors.email ? "border-red-500" : ""}
          placeholder="your.email@example.com"
        />
        {fieldErrors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading} aria-live="polite">
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Sending Reset Link...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <div className="text-center text-sm">
        {"Remember your password? "}
        <Link
          href="/auth/sign-in"
          className="text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Sign in
        </Link>
      </div>
    </form>
  )
}
