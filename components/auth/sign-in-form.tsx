"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Mail, RefreshCw } from "lucide-react"
import { handleAuthError, getFieldErrors, trackAuthError } from "@/utils/auth-error-handler"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | undefined>(undefined)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const { signIn, signUp } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Use effect to safely access search params after mount
  useEffect(() => {
    if (searchParams) {
      const redirectTo = searchParams.get("redirectTo")
      if (redirectTo) {
        setRedirectPath(redirectTo)
      }

      // Check for error parameter from callback
      const errorParam = searchParams.get("error")
      if (errorParam) {
        setError(decodeURIComponent(errorParam))
      }
    }
  }, [searchParams])

  useEffect(() => {
    // Clear any errors when inputs change
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null)
      setFieldErrors({})
      setIsEmailVerificationError(false)
    }
  }, [email, password, error, fieldErrors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})
    setIsEmailVerificationError(false)

    try {
      // Check if we're online before attempting sign-in
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const errorInfo = handleAuthError({ message: "You appear to be offline" }, "sign-in")
        setError(errorInfo.message)
        trackAuthError(errorInfo, "sign-in")
        setIsLoading(false)
        return
      }

      // Pass credentials as a single object with the correct structure
      const result = await signIn({ email, password }, redirectPath)

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
        setIsLoading(false)
        return
      }

      if (result.error) {
        // Use our enhanced error handler
        const errorInfo = handleAuthError(result.error, "sign-in")

        // Track the error for analytics
        trackAuthError(errorInfo, "sign-in")

        // Check if it's an email verification error
        if (errorInfo.code === "email_not_verified") {
          setIsEmailVerificationError(true)
        }

        // Set the user-friendly error message
        setError(errorInfo.message)

        // Check for field-specific errors
        const validationErrors = getFieldErrors(result.error)
        if (Object.keys(validationErrors).length > 0) {
          setFieldErrors(validationErrors)
        }

        setIsLoading(false)
        return
      }

      // If we get here, sign-in was successful
      // Manually redirect if the auth context doesn't handle it
      if (!redirectPath) {
        router.push("/dashboard")
      }
    } catch (err: any) {
      const errorInfo = handleAuthError(err, "sign-in")
      setError(errorInfo.message)
      trackAuthError(errorInfo, "sign-in")
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address to resend verification")
      return
    }

    setIsResendingVerification(true)
    setError(null)

    try {
      // Use the sign-up function to resend verification
      const result = await signUp({ email, password: "temporary-password" })

      if (result.error) {
        // If the error indicates the user already exists, that's actually good in this context
        if (result.error.message?.includes("already exists")) {
          setError("Verification email sent. Please check your inbox.")
        } else {
          const errorInfo = handleAuthError(result.error, "resend-verification")
          setError(`Failed to resend verification: ${errorInfo.message}`)
          trackAuthError(errorInfo, "resend-verification")
        }
      } else {
        setError("Verification email sent. Please check your inbox.")
      }
    } catch (err: any) {
      const errorInfo = handleAuthError(err, "resend-verification")
      setError(`Failed to resend verification: ${errorInfo.message}`)
      trackAuthError(errorInfo, "resend-verification")
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="sign-in-heading">
      <h2 id="sign-in-heading" className="sr-only">
        Sign in form
      </h2>

      {error && !isEmailVerificationError && (
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          <AlertTitle>Sign in failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEmailVerificationError && (
        <Alert className="rounded-md bg-amber-50 p-4 text-sm text-amber-700" role="alert" aria-live="assertive">
          <Mail className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Email Verification Required</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Please verify your email address before signing in. Check your inbox for a verification link.
            </p>
            <p>
              If you didn't receive the email, you can{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-amber-800 underline"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
              >
                {isResendingVerification ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 inline animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  "request a new verification email"
                )}
              </Button>
            </p>
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
        />
        {fieldErrors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" id="password-label">
            Password
          </Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="Forgot password"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          aria-labelledby="password-label"
          aria-required="true"
          autoComplete="current-password"
          aria-invalid={!!fieldErrors.password}
          aria-errormessage={fieldErrors.password ? "password-error" : undefined}
          className={fieldErrors.password ? "border-red-500" : ""}
        />
        {fieldErrors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading} aria-live="polite">
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Sign up
        </Link>
      </div>
    </form>
  )
}
