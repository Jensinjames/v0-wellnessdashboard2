/**
 * Sign Up Form Component
 * Handles user registration with email verification
 */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Mail, CheckCircle, ArrowRight, Info, Shield } from "lucide-react"
import { handleAuthError, getFieldErrors } from "@/utils/auth-error-handler"
import { validateEmail, validatePasswordStrength } from "@/utils/auth-validation"

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  // Clear errors when inputs change
  useEffect(() => {
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null)
      setFieldErrors({})
    }
  }, [email, password, confirmPassword, error, fieldErrors])

  // Check password strength when password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null)
      return
    }

    const { score } = validatePasswordStrength(password)

    if (score < 3) setPasswordStrength("weak")
    else if (score < 5) setPasswordStrength("medium")
    else setPasswordStrength("strong")
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})
    setSignUpSuccess(false)
    setEmailVerificationSent(false)

    // Validate inputs
    const validationErrors: { email?: string; password?: string } = {}

    if (!email) {
      validationErrors.email = "Email is required"
    } else if (!validateEmail(email)) {
      validationErrors.email = "Please enter a valid email address"
    }

    if (!password) {
      validationErrors.password = "Password is required"
    } else if (password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters"
    }

    // Custom validation for password confirmation
    if (password !== confirmPassword) {
      validationErrors.password = "Passwords do not match"
    }

    // Check if password is too weak
    if (passwordStrength === "weak") {
      validationErrors.password =
        "Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters"
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setIsLoading(false)
      return
    }

    // Check if we're online before attempting sign-up
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const errorInfo = handleAuthError({ message: "You appear to be offline" }, { operation: "sign-up" })
      setError(errorInfo.message)
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp({ email, password })

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
        setIsLoading(false)
        return
      }

      if (result.error) {
        // Use our enhanced error handler
        const errorInfo = handleAuthError(result.error, { operation: "sign-up" })

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

      // If email verification was sent, show the verification sent state
      if (result.emailVerificationSent) {
        setEmailVerificationSent(true)
        setSignUpSuccess(true)
        setIsLoading(false)
        return
      }

      // If we get here, the sign-up was successful but no verification email was sent
      setSignUpSuccess(true)

      // Show success message for a moment before redirecting
      setTimeout(() => {
        router.push("/auth/verify-email")
      }, 1500)
    } catch (err: any) {
      const errorInfo = handleAuthError(err, { operation: "sign-up" })
      setError(errorInfo.message)
      setIsLoading(false)
    } finally {
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
          setEmailVerificationSent(true)
          setError(null)
        } else {
          const errorInfo = handleAuthError(result.error, { operation: "resend-verification" })
          setError(`Failed to resend verification: ${errorInfo.message}`)
        }
      } else {
        setEmailVerificationSent(true)
      }
    } catch (err: any) {
      const errorInfo = handleAuthError(err, { operation: "resend-verification" })
      setError(`Failed to resend verification: ${errorInfo.message}`)
    } finally {
      setIsResendingVerification(false)
    }
  }

  // Get password strength color
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "text-red-500"
      case "medium":
        return "text-amber-500"
      case "strong":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="sign-up-heading">
      <h2 id="sign-up-heading" className="sr-only">
        Sign up form
      </h2>

      {error && (
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          <AlertTitle>Sign up failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {emailVerificationSent && (
        <Alert className="mb-4 bg-blue-50" role="status" aria-live="polite">
          <Mail className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Verification Email Sent</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the
              verification link to complete your registration.
            </p>
            <p className="mb-2">
              If you don't see the email, please check your spam folder or click the button below to resend.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
              >
                {isResendingVerification ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                    Resend Verification
                  </>
                )}
              </Button>
              <Button type="button" size="sm" onClick={() => router.push("/auth/sign-in")}>
                <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />
                Go to Sign In
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {signUpSuccess && !emailVerificationSent && (
        <Alert className="mb-4 bg-green-50" role="status" aria-live="polite">
          <CheckCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Sign-up Successful</AlertTitle>
          <AlertDescription>
            Your account has been created successfully. You'll be redirected to the verification page.
          </AlertDescription>
        </Alert>
      )}

      {!emailVerificationSent && (
        <>
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
              disabled={isLoading || signUpSuccess}
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
            <Label htmlFor="password" id="password-label" className="flex items-center justify-between">
              <span>Password</span>
              {passwordStrength && (
                <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                  <Shield className="h-3 w-3 inline mr-1" />
                  {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                </span>
              )}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || signUpSuccess}
              aria-labelledby="password-label"
              aria-required="true"
              autoComplete="new-password"
              aria-describedby="password-requirements"
              aria-invalid={!!fieldErrors.password}
              aria-errormessage={fieldErrors.password ? "password-error" : undefined}
              className={fieldErrors.password ? "border-red-500" : ""}
            />
            <div id="password-requirements" className="text-xs text-gray-500 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Password should be at least 8 characters long and include uppercase, lowercase, numbers, and special
                characters for better security.
              </span>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" id="confirm-password-label">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading || signUpSuccess}
              aria-labelledby="confirm-password-label"
              aria-required="true"
              autoComplete="new-password"
              aria-invalid={password !== confirmPassword && confirmPassword !== ""}
              className={password !== confirmPassword && confirmPassword !== "" ? "border-red-500" : ""}
            />
            {password !== confirmPassword && confirmPassword !== "" && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || signUpSuccess}
            aria-busy={isLoading}
            aria-live="polite"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Signing up...
              </>
            ) : signUpSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                Success!
              </>
            ) : (
              "Sign up"
            )}
          </Button>
        </>
      )}

      <div className="text-center text-sm">
        Already have an account?{" "}
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
