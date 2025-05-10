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
import { Info, AlertTriangle, Wifi, RefreshCw } from "lucide-react"

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [mockSignUp, setMockSignUp] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false)
  const [databaseError, setDatabaseError] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  // Clear errors when inputs change
  useEffect(() => {
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null)
      setFieldErrors({})
    }
  }, [email, password, confirmPassword, error, fieldErrors])

  // Check browser's online status
  useEffect(() => {
    const handleOnline = () => {
      if (networkError) {
        setNetworkError(false)
        setError(null)
      }
    }

    const handleOffline = () => {
      setNetworkError(true)
      setError("You appear to be offline. Please check your internet connection.")
    }

    // Set initial state
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNetworkError(true)
      setError("You appear to be offline. Please check your internet connection.")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [networkError])

  const handleNetworkCheck = async () => {
    setIsCheckingNetwork(true)

    try {
      // Try to fetch a known endpoint
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const endpoints = [
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        "https://www.google.com",
        "https://www.cloudflare.com",
      ]

      let connected = false

      for (const endpoint of endpoints) {
        try {
          await fetch(endpoint, {
            method: "HEAD",
            signal: controller.signal,
            mode: "no-cors",
            cache: "no-store",
          })
          connected = true
          break
        } catch (err) {
          // Try next endpoint
          console.warn(`Failed to connect to ${endpoint}`)
        }
      }

      clearTimeout(timeoutId)

      if (connected) {
        setNetworkError(false)
        setError(null)
      } else {
        setNetworkError(true)
        setError("Still unable to connect. Please check your internet connection.")
      }
    } catch (err) {
      setNetworkError(true)
      setError("Network check failed. Please try again later.")
    } finally {
      setIsCheckingNetwork(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})
    setMockSignUp(false)
    setDatabaseError(false)
    setSignUpSuccess(false)

    // Custom validation for password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setFieldErrors({ password: "Passwords do not match" })
      setIsLoading(false)
      return
    }

    // Check if we're online before attempting sign-up
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNetworkError(true)
      setError("You appear to be offline. Sign-up requires an internet connection.")
      setIsLoading(false)
      return
    }

    try {
      // Pass credentials as a single object with the correct structure
      const result = await signUp({ email, password })

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
        setIsLoading(false)
        return
      }

      if (result.error) {
        // Check if it's a network error
        if (
          result.error.message?.includes("Failed to fetch") ||
          result.error.message?.includes("Network") ||
          result.error.message?.includes("network") ||
          result.error.message?.includes("connect")
        ) {
          setNetworkError(true)
          setError(
            "Network error: Unable to connect to the authentication service. Please check your internet connection.",
          )
        }
        // Check if it's a database error
        else if (result.error.message?.includes("Database error")) {
          console.log("Database error detected, proceeding with mock sign-up")
          setDatabaseError(true)
          setError("Database error detected. You'll be signed up in demo mode.")
          setMockSignUp(true)

          // Wait a moment before redirecting to simulate the sign-up process
          setTimeout(() => {
            router.push("/dashboard")
          }, 3000)
          return
        } else {
          setError(result.error.message)
        }
        setIsLoading(false)
        return
      }

      if (result.networkIssue) {
        setNetworkError(true)
        setError("Network issue detected. You've been signed up in offline mode.")
        setMockSignUp(true)

        // Wait a moment before redirecting to simulate the sign-up process
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
        return
      }

      if (result.mockSignUp) {
        setMockSignUp(true)
        // Wait a moment before redirecting to simulate the sign-up process
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
        return
      }

      // If we get here, the sign-up was successful
      setSignUpSuccess(true)

      // Show success message for a moment before redirecting
      setTimeout(() => {
        // Redirect to the verification page
        router.push("/auth/verify-email")
      }, 1500)
    } catch (err: any) {
      // Check if it's a network error
      if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("Network") ||
        err.message?.includes("network") ||
        err.message?.includes("connect")
      ) {
        setNetworkError(true)
        setError(
          "Network error: Unable to connect to the authentication service. Please check your internet connection.",
        )
      }
      // Check if it's a database error
      else if (err.message?.includes("Database error")) {
        console.log("Database error caught in form handler, proceeding with mock sign-up")
        setDatabaseError(true)
        setError("Database error detected. You'll be signed up in demo mode.")
        setMockSignUp(true)

        // Wait a moment before redirecting to simulate the sign-up process
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
        return
      } else {
        setError(err.message || "An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="sign-up-heading">
      <h2 id="sign-up-heading" className="sr-only">
        Sign up form
      </h2>

      {error && !networkError && !databaseError && (
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          {error}
        </Alert>
      )}

      {networkError && (
        <Alert className="rounded-md bg-amber-50 p-4 text-sm text-amber-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Network Issue</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{error || "Unable to connect to the authentication service."}</p>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNetworkCheck}
                disabled={isCheckingNetwork}
                className="bg-amber-100/50"
                aria-label={isCheckingNetwork ? "Checking network connection" : "Check network connection"}
              >
                {isCheckingNetwork ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Check Connection</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-amber-100/50"
                aria-label="Reload page"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>Reload Page</span>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {databaseError && (
        <Alert className="rounded-md bg-amber-50 p-4 text-sm text-amber-700" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Database Issue</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{error || "Unable to save user data to the database."}</p>
            <p>You'll be signed up in demo mode and redirected shortly.</p>
          </AlertDescription>
        </Alert>
      )}

      {mockSignUp && (
        <Alert className="mb-4" role="status" aria-live="polite">
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're being signed up in demo mode due to {networkError ? "network connectivity" : "database connectivity"}{" "}
            issues. You'll be redirected to the dashboard shortly.
          </AlertDescription>
        </Alert>
      )}

      {signUpSuccess && (
        <Alert className="mb-4 bg-green-50" role="status" aria-live="polite">
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Sign-up Successful</AlertTitle>
          <AlertDescription>
            Your account has been created successfully. You'll be redirected to the verification page.
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
          disabled={isLoading || mockSignUp || signUpSuccess}
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
          disabled={isLoading || mockSignUp || signUpSuccess}
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
          disabled={isLoading || mockSignUp || signUpSuccess}
          aria-labelledby="confirm-password-label"
          aria-required="true"
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || mockSignUp || signUpSuccess || (networkError && !navigator.onLine)}
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading ? "Signing up..." : mockSignUp ? "Redirecting..." : signUpSuccess ? "Success!" : "Sign up"}
      </Button>

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
