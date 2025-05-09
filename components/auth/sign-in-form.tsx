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
import { Info, AlertTriangle, Mail, Loader2, Database, RefreshCw, User } from "lucide-react"
import { handleAuthError } from "@/utils/auth-error-handler"
import { checkSupabaseConnection } from "@/lib/supabase-client-enhanced"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [mockSignIn, setMockSignIn] = useState(false)
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [databaseError, setDatabaseError] = useState(false)
  const [redirectPath, setRedirectPath] = useState("/dashboard")
  const [connectionStatus, setConnectionStatus] = useState<{ isConnected: boolean; latency: number } | null>(null)
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const { signIn, refreshSession, getAnonymousId } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [signInAttempts, setSignInAttempts] = useState(0)

  // Use effect to safely access search params after mount
  useEffect(() => {
    if (searchParams) {
      const redirectTo = searchParams.get("redirectTo")
      if (redirectTo) {
        setRedirectPath(redirectTo)
      }
    }
  }, [searchParams])

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      setIsCheckingConnection(true)
      try {
        const status = await checkSupabaseConnection()
        setConnectionStatus(status)

        if (!status.isConnected) {
          setNetworkError(true)
          setError("Unable to connect to the authentication service. You can try again or use demo mode.")
        }
      } catch (err) {
        console.error("Error checking connection:", err)
      } finally {
        setIsCheckingConnection(false)
      }
    }

    checkConnection()
  }, [])

  useEffect(() => {
    // Clear any errors when inputs change
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null)
      setFieldErrors({})
      setIsEmailVerificationError(false)
      setNetworkError(false)
      setDatabaseError(false)
    }
  }, [email, password, error, fieldErrors])

  // Attempt to refresh the session on component mount
  // This can help with cases where the session is still valid but the UI doesn't reflect it
  useEffect(() => {
    const attemptSessionRefresh = async () => {
      try {
        await refreshSession()
      } catch (err) {
        // Silently fail - this is just a proactive attempt
      }
    }

    attemptSessionRefresh()
  }, [refreshSession])

  const handleConnectionCheck = async () => {
    setIsCheckingConnection(true)
    try {
      const status = await checkSupabaseConnection()
      setConnectionStatus(status)

      if (status.isConnected) {
        setNetworkError(false)
        setError(null)
      } else {
        setNetworkError(true)
        setError("Still unable to connect to the authentication service. You can try again or use demo mode.")
      }
    } catch (err) {
      console.error("Error checking connection:", err)
      setNetworkError(true)
      setError("Connection check failed. Please try again later or use demo mode.")
    } finally {
      setIsCheckingConnection(false)
    }
  }

  // Update the handleSubmit function to better handle database errors
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})
    setMockSignIn(false)
    setIsEmailVerificationError(false)
    setNetworkError(false)
    setDatabaseError(false)
    setSignInAttempts((prev) => prev + 1)

    // Get the anonymous ID for potential data migration
    const anonymousId = getAnonymousId()
    console.log(`Current anonymous ID: ${anonymousId}`)

    try {
      // Trim the email to prevent whitespace issues
      const trimmedEmail = email.trim()

      // For demo mode, bypass the regular sign-in flow after multiple failed attempts
      // or if using demo credentials
      if (
        (signInAttempts >= 1 && trimmedEmail === "demo@example.com" && password === "demo123") ||
        (signInAttempts >= 2 && databaseError)
      ) {
        setMockSignIn(true)
        // Wait a moment before redirecting to simulate the sign-in process
        setTimeout(() => {
          router.push(redirectPath)
        }, 2000)
        setIsLoading(false)
        return
      }

      // Check connection status before attempting sign-in
      if (!connectionStatus?.isConnected && signInAttempts === 0) {
        // First attempt with connection issues, check again
        const newStatus = await checkSupabaseConnection()
        setConnectionStatus(newStatus)

        if (!newStatus.isConnected) {
          setNetworkError(true)
          setError("Unable to connect to the authentication service. You can try again or use demo mode.")
          setIsLoading(false)
          return
        }
      }

      // Pass credentials as a single object with the correct structure
      const result = await signIn({ email: trimmedEmail, password })

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
        setIsLoading(false)
        return
      }

      if (result.error) {
        const errorMessage = result.error.message || "An error occurred during sign-in"

        // Check if it's a database error - expanded conditions
        if (
          errorMessage.includes("Database error") ||
          errorMessage.includes("database error") ||
          errorMessage.includes("Database error granting user") ||
          errorMessage.includes("db error") ||
          errorMessage.includes("database connection") ||
          errorMessage.includes("connection error")
        ) {
          setDatabaseError(true)
          setError(handleAuthError(result.error, "sign-in"))

          // If this is at least the second attempt with a database error,
          // suggest using demo mode more prominently
          if (signInAttempts >= 1) {
            setTimeout(() => {
              const demoButton = document.querySelector('button[aria-label="Use demo mode"]') as HTMLButtonElement
              if (demoButton) {
                demoButton.focus()
                demoButton.classList.add("animate-pulse")
                setTimeout(() => demoButton.classList.remove("animate-pulse"), 2000)
              }
            }, 500)
          }
        }
        // Check if it's an email verification error
        else if (errorMessage.includes("verify your email") || errorMessage.includes("Email not confirmed")) {
          setIsEmailVerificationError(true)
          setError(errorMessage)
        }
        // Check if it's a network error
        else if (
          errorMessage.includes("network") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("Network Error")
        ) {
          setNetworkError(true)
          setError(handleAuthError(result.error, "sign-in"))
        }
        // General error
        else {
          setError(handleAuthError(result.error, "sign-in"))
        }

        setIsLoading(false)
        return
      }

      if (result.mockSignIn) {
        setMockSignIn(true)
        // Wait a moment before redirecting to simulate the sign-in process
        setTimeout(() => {
          router.push(redirectPath)
        }, 2000)
        return
      }

      // If we get here, sign-in was successful
      router.push(redirectPath)
    } catch (err: any) {
      console.error("Unexpected error during sign-in:", err)

      // Check if it's a database error
      if (
        err.message &&
        (err.message.includes("Database error") ||
          err.message.includes("database error") ||
          err.message.includes("db error"))
      ) {
        setDatabaseError(true)
      } else {
        setError(handleAuthError(err, "sign-in"))
      }
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || !email.trim()) {
      setFieldErrors({ email: "Please enter your email address" })
      return
    }

    try {
      setIsLoading(true)

      // This would be implemented in your auth context
      // For now, we'll just show a success message
      setTimeout(() => {
        alert(`If an account exists with ${email}, a verification email has been sent.`)
        setIsLoading(false)
      }, 1000)
    } catch (err) {
      console.error("Error sending verification email:", err)
      setError("Failed to send verification email. Please try again.")
      setIsLoading(false)
    }
  }

  const handleDemoSignIn = () => {
    setEmail("demo@example.com")
    setPassword("demo123")
    // Submit the form with demo credentials
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement
      if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
    }, 100)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="sign-in-heading">
      <h2 id="sign-in-heading" className="sr-only">
        Sign in form
      </h2>

      {error && !isEmailVerificationError && !networkError && !databaseError && (
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          {error}
        </Alert>
      )}

      {networkError && (
        <Alert className="rounded-md bg-orange-50 p-4 text-sm text-orange-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription>
            {error ||
              "Unable to connect to the authentication service. Please check your internet connection and try again."}
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-orange-100 border-orange-200 text-orange-800 hover:bg-orange-200"
                onClick={handleConnectionCheck}
                disabled={isCheckingConnection}
              >
                {isCheckingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Check Connection</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-orange-100 border-orange-200 text-orange-800 hover:bg-orange-200"
                onClick={handleDemoSignIn}
              >
                <User className="h-4 w-4 mr-2" aria-hidden="true" />
                Try Demo Mode
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {databaseError && (
        <Alert className="rounded-md bg-blue-50 p-4 text-sm text-blue-700" role="alert" aria-live="assertive">
          <Database className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Database Connection Issue</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              {error ||
                "We're experiencing a temporary database issue. This might be due to maintenance or high traffic."}
            </p>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Retry
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200"
                onClick={handleDemoSignIn}
                aria-label="Use demo mode"
              >
                <User className="h-4 w-4 mr-2" aria-hidden="true" />
                Use Demo Mode
              </Button>
            </div>
          </AlertDescription>
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
                disabled={isLoading}
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
          disabled={isLoading || mockSignIn}
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
          disabled={isLoading || mockSignIn}
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
        disabled={isLoading || mockSignIn}
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
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

      {/* Demo mode button */}
      <div className="text-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={handleDemoSignIn}
          disabled={isLoading || mockSignIn}
        >
          Use Demo Mode
        </Button>
      </div>
    </form>
  )
}
