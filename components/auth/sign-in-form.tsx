"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Mail } from "lucide-react"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | undefined>(undefined)
  const { signIn } = useAuth()
  const searchParams = useSearchParams()

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
      // Pass credentials as a single object with the correct structure
      const result = await signIn({ email, password }, redirectPath)

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
        setIsLoading(false)
        return
      }

      if (result.error) {
        // Check if it's an email verification error
        if (
          result.error.message?.includes("verify your email") ||
          result.error.message?.includes("Email not confirmed")
        ) {
          setIsEmailVerificationError(true)
          setError(result.error.message)
        } else {
          setError(result.error.message)
        }
        setIsLoading(false)
        return
      }

      // If we get here, sign-in was successful
      // The redirect will be handled by the auth context
    } catch (err: any) {
      console.error("Unexpected error during sign-in:", err)
      setError(err.message || "An unexpected error occurred")
      setIsLoading(false)
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
          {error}
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
                onClick={() => {
                  // Here you would implement resending the verification email
                  alert("Verification email resend functionality would go here")
                }}
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
        {isLoading ? "Signing in..." : "Sign in"}
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
