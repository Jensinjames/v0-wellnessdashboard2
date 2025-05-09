"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context-improved"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mail, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const { signUp, isSigningUp } = useAuth()
  const router = useRouter()

  // Clear errors when inputs change
  useEffect(() => {
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null)
      setFieldErrors({})
    }
  }, [email, password, confirmPassword, error, fieldErrors])

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset states
    setError(null)
    setFieldErrors({})
    setSignUpSuccess(false)
    setEmailVerificationSent(false)

    // Custom validation
    const validationErrors: { email?: string; password?: string } = {}

    // Validate email
    if (!email.trim()) {
      validationErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = "Please enter a valid email address"
    }

    // Validate password
    if (!password) {
      validationErrors.password = "Password is required"
    } else if (password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters"
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // If validation errors exist, show them and stop
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    try {
      // Attempt to sign up
      const result = await signUp({ email, password })

      if (!result.success) {
        // Handle sign-up error
        if (result.error) {
          setError(result.error.message)
        } else {
          setError("An unexpected error occurred during sign-up")
        }
        return
      }

      // Check if email verification was sent
      if (result.emailVerificationSent) {
        setEmailVerificationSent(true)
        setSignUpSuccess(true)
        return
      }

      // If we get here, sign-up was successful and user is already authenticated
      setSignUpSuccess(true)

      // Show success message for a moment before redirecting
      setTimeout(() => {
        // Redirect to the dashboard or profile completion page
        router.push("/dashboard")
      }, 1500)
    } catch (err: any) {
      console.error("Unexpected error during sign-up:", err)
      setError(err.message || "An unexpected error occurred")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="sign-up-heading">
      <h2 id="sign-up-heading" className="sr-only">
        Sign up form
      </h2>

      {error && (
        <Alert className="rounded-md bg-red-50 text-red-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          <AlertTitle>Sign-up Error</AlertTitle>
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
            <p>
              If you don't see the email, please check your spam folder or request a new verification email from the
              sign-in page.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {signUpSuccess && !emailVerificationSent && (
        <Alert className="mb-4 bg-green-50" role="status" aria-live="polite">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Sign-up Successful</AlertTitle>
          <AlertDescription>
            Your account has been created successfully. You'll be redirected to the dashboard.
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
              disabled={isSigningUp || signUpSuccess}
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
            <Label htmlFor="password" id="password-label">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSigningUp || signUpSuccess}
              aria-labelledby="password-label"
              aria-required="true"
              autoComplete="new-password"
              aria-describedby="password-requirements"
              aria-invalid={!!fieldErrors.password}
              aria-errormessage={fieldErrors.password ? "password-error" : undefined}
              className={fieldErrors.password ? "border-red-500" : ""}
            />
            <p id="password-requirements" className="text-xs text-gray-500">
              Password should be at least 8 characters long
            </p>
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
              disabled={isSigningUp || signUpSuccess}
              aria-labelledby="confirm-password-label"
              aria-required="true"
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSigningUp || signUpSuccess} aria-busy={isSigningUp}>
            {isSigningUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing up...
              </>
            ) : signUpSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Success!
              </>
            ) : (
              "Sign up"
            )}
          </Button>
        </>
      )}

      {emailVerificationSent && (
        <div className="flex justify-center">
          <Button type="button" onClick={() => router.push("/auth/sign-in")} className="mt-4">
            Go to Sign In
          </Button>
        </div>
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
