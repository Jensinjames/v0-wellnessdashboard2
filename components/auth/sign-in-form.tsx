"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, AlertTriangle, Mail, Loader2, Database, RefreshCw, Wifi } from "lucide-react"
import type { Database as DatabaseType } from "@/types/database"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false)
  const [databaseError, setDatabaseError] = useState(false)
  const [redirectPath, setRedirectPath] = useState("/dashboard")

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient<DatabaseType>()

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
      setNetworkError(false)
      setDatabaseError(false)
    }
  }, [email, password, error, fieldErrors])

  // Attempt to refresh the session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (data.session && !error) {
          // User is already signed in, redirect
          router.push(redirectPath)
        }
      } catch (err) {
        // Silently fail - this is just a proactive check
        console.error("Session check error:", err)
      }
    }

    checkSession()
  }, [router, redirectPath, supabase.auth])

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
    setIsAnonymous(false)
    setIsEmailVerificationError(false)
    setNetworkError(false)
    setDatabaseError(false)

    // Basic validation
    if (!email.trim() && !isAnonymous) {
      setFieldErrors((prev) => ({ ...prev, email: "Email is required" }))
      setIsLoading(false)
      return
    }

    if (!password.trim() && !isAnonymous) {
      setFieldErrors((prev) => ({ ...prev, password: "Password is required" }))
      setIsLoading(false)
      return
    }

    // Check if we're online before attempting sign-in
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNetworkError(true)
      setError("You appear to be offline. Sign-in requires an internet connection.")
      setIsLoading(false)
      return
    }

    try {
      // Trim the email to prevent whitespace issues
      const trimmedEmail = email.trim()

      if (trimmedEmail === "demo@example.com" && password === "demo123") {
        // Use anonymous authentication for demo mode
        const { data, error } = await supabase.auth.signInAnonymously()

        if (error) {
          console.error("Anonymous sign-in error:", error)
          setError(error.message)
          setIsLoading(false)
          return
        }

        setIsAnonymous(true)

        // Create a profile for the anonymous user
        if (data.user) {
          try {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email: "anonymous@example.com",
              first_name: "Demo",
              last_name: "User",
              is_anonymous: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          } catch (profileError) {
            console.error("Error creating anonymous profile:", profileError)
            // Don't fail the sign-in if profile creation fails
          }
        }

        // Redirect to dashboard
        router.push(redirectPath)
        return
      }

      // Regular email/password sign-in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes("Email not confirmed")) {
          setIsEmailVerificationError(true)
          setError("Please verify your email before signing in. Check your inbox for a verification link.")
        } else if (
          error.message.includes("Database error") ||
          error.message.includes("database error") ||
          error.message.includes("Database error granting user")
        ) {
          setDatabaseError(true)
          setError(error.message)
        } else if (
          error.message.includes("network") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network Error")
        ) {
          setNetworkError(true)
          setError(error.message)
        } else {
          setError(error.message)
        }

        setIsLoading(false)
        return
      }

      // If we get here, sign-in was successful
      console.log("Sign-in successful, redirecting to:", redirectPath)
      router.push(redirectPath)
    } catch (err: any) {
      console.error("Unexpected error during sign-in:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
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

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(`Failed to resend verification email: ${error.message}`)
      } else {
        alert(`If an account exists with ${email}, a verification email has been sent.`)
      }
    } catch (err: any) {
      console.error("Error sending verification email:", err)
      setError("Failed to send verification email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnonymousSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInAnonymously()

      if (error) {
        console.error("Anonymous sign-in error:", error)
        setError(error.message)
        setIsLoading(false)
        return
      }

      setIsAnonymous(true)

      // Create a profile for the anonymous user
      if (data.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: "anonymous@example.com",
            first_name: "Demo",
            last_name: "User",
            is_anonymous: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        } catch (profileError) {
          console.error("Error creating anonymous profile:", profileError)
          // Don't fail the sign-in if profile creation fails
        }
      }

      // Redirect to dashboard
      router.push(redirectPath)
    } catch (err: any) {
      console.error("Unexpected error during anonymous sign-in:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
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
            <p className="mb-2">
              {error || "Unable to connect to the authentication service. Please check your internet connection."}
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNetworkCheck}
                disabled={isCheckingNetwork}
                className="bg-orange-100/50"
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
                className="bg-orange-100/50"
                aria-label="Reload page"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>Reload Page</span>
              </Button>
            </div>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAnonymousSignIn}
                className="bg-orange-100/50 border-orange-200"
              >
                Use Demo Mode
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
                Retry
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200"
                onClick={handleAnonymousSignIn}
              >
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

      {isAnonymous && (
        <Alert className="mb-4" role="status" aria-live="polite">
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're being signed in with anonymous credentials. You'll be redirected to the dashboard shortly.
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
          disabled={isLoading || isAnonymous}
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
          disabled={isLoading || isAnonymous}
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
        disabled={isLoading || isAnonymous}
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : isAnonymous ? (
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
          onClick={handleAnonymousSignIn}
          disabled={isLoading || isAnonymous}
        >
          Use Demo Mode
        </Button>
      </div>
    </form>
  )
}
