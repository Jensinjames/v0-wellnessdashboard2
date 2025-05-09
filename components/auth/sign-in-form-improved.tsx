"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context-improved"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mail, AlertTriangle, Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)
  const [redirectPath, setRedirectPath] = useState("/dashboard")

  const { signIn, isSigningIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get redirect path from URL query parameters
  useEffect(() => {
    if (searchParams) {
      const redirectTo = searchParams.get("redirectTo")
      if (redirectTo) {
        setRedirectPath(redirectTo)
      }
    }
  }, [searchParams])

  // Clear errors when inputs change
  useEffect(() => {
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null)
      setFieldErrors({})
      setIsEmailVerificationError(false)
    }
  }, [email, password, error, fieldErrors])

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset states
    setError(null)
    setFieldErrors({})
    setIsEmailVerificationError(false)

    // Custom validation
    const validationErrors: { email?: string; password?: string } = {}

    // Validate email
    if (!email.trim()) {
      validationErrors.email = "Email is required"
    }

    // Validate password
    if (!password) {
      validationErrors.password = "Password is required"
    }

    // If validation errors exist, show them and stop
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    try {
      // Attempt to sign in
      const result = await signIn({ email, password })

      if (!result.success) {
        // Check if it's an email verification error
        if (result.needsEmailVerification) {
          setIsEmailVerificationError(true)
          setError(result.error?.message || "Please verify your email before signing in")
          return
        }

        // Handle other sign-in errors
        if (result.error) {
          setError(result.error.message)
        } else {
          setError("An unexpected error occurred during sign-in")
        }
        return
      }

      // If we get here, sign-in was successful
      router.push(redirectPath)
    } catch (err: any) {
      console.error("Unexpected error during sign-in:", err)
      setError(err.message || "An unexpected error occurred")
    }
  }

  // Request email verification resend
  const handleResendVerification = async () => {
    try {
      // Get Supabase client and request password reset
      // This will trigger a new verification email
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) {
        setError(`Failed to resend verification: ${error.message}`)
        return
      }

      // Show success message
      setIsEmailVerificationError(false)
      setError("Verification email has been resent. Please check your inbox.")
    } catch (err: any) {
      console.error("Error resending verification:", err)
      setError(`Failed to resend verification: ${err.message}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="sign-in-heading">
      <h2 id="sign-in-heading" className="sr-only">
        Sign in form
      </h2>

      {error && !isEmailVerificationError && (
        <Alert className="rounded-md bg-red-50 text-red-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          <AlertTitle>Sign-in Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEmailVerificationError && (
        <Alert className="rounded-md bg-amber-50 text-amber-700" role="alert" aria-live="assertive">
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
              >
                request a new verification email
              </Button>
              .
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
          disabled={isSigningIn}
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
          disabled={isSigningIn}
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

      <Button type="submit" className="w-full" disabled={isSigningIn} aria-busy={isSigningIn}>
        {isSigningIn ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
