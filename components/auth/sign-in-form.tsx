"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, AlertTriangle, Mail, Loader2 } from "lucide-react"
import { extractRedirectPath, extractAuthToken, storeRedirectPath, handleAuthToken } from "@/utils/auth-redirect"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [mockSignIn, setMockSignIn] = useState(false)
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)
  const [redirectPath, setRedirectPath] = useState("/dashboard")
  const [isProcessingToken, setIsProcessingToken] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Process URL parameters on mount
  useEffect(() => {
    if (!searchParams) return

    // Get the current URL for token extraction
    const currentUrl = typeof window !== "undefined" ? window.location.href : ""

    // Extract authentication token if present
    const token = extractAuthToken(currentUrl)

    // Get and process the redirectTo parameter
    const redirectParam = searchParams.get("redirectTo")
    const cleanRedirectPath = extractRedirectPath(redirectParam)
    setRedirectPath(cleanRedirectPath)

    // If we have a token, process it
    if (token) {
      setIsProcessingToken(true)
      setIsLoading(true)

      handleAuthToken(token, cleanRedirectPath)
        .then((success) => {
          if (success) {
            // Token processed successfully, redirect
            window.location.href = cleanRedirectPath
          } else {
            // Token processing failed
            setError("Authentication token processing failed")
            setIsLoading(false)
          }
        })
        .finally(() => {
          setIsProcessingToken(false)
        })
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

    // Don't process if we're already handling a token
    if (isProcessingToken) return

    setIsLoading(true)
    setError(null)
    setFieldErrors({})
    setMockSignIn(false)
    setIsEmailVerificationError(false)

    try {
      console.log(`Attempting sign in with redirect to: ${redirectPath}`)

      // Store the redirect path before authentication
      storeRedirectPath(redirectPath)

      // Pass credentials as a single object with the correct structure
      const result = await signIn({ email, password })

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

      if (result.mockSignIn) {
        setMockSignIn(true)
        // Wait a moment before redirecting to simulate the sign-in process
        setTimeout(() => {
          console.log(`Mock sign-in successful, redirecting to: ${redirectPath}`)
          router.push(redirectPath)
        }, 2000)
        return
      }

      // If we get here, sign-in was successful
      console.log(`Sign-in successful, redirecting to: ${redirectPath}`)

      // Force a hard navigation to ensure proper session handling
      window.location.href = redirectPath
    } catch (err: any) {
      console.error("Unexpected error during sign-in:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="sign-in-heading">
      <h2 id="sign-in-heading" className="sr-only">
        Sign in form
      </h2>

      {isProcessingToken && (
        <Alert className="mb-4" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
          <AlertTitle>Processing Authentication</AlertTitle>
          <AlertDescription>Please wait while we process your authentication token...</AlertDescription>
        </Alert>
      )}

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

      {mockSignIn && (
        <Alert className="mb-4" role="status" aria-live="polite">
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're being signed in with demo credentials. You'll be redirected to the dashboard shortly.
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
          disabled={isLoading || mockSignIn || isProcessingToken}
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
          disabled={isLoading || mockSignIn || isProcessingToken}
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

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || mockSignIn || isProcessingToken}
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isProcessingToken ? "Processing..." : "Signing in..."}
          </>
        ) : mockSignIn ? (
          "Redirecting..."
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
