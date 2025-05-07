"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Mail, Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client-simplified"
import { handleAuthError } from "@/utils/auth-error-handler"

export function EnhancedSignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get the redirect path from URL params or default to home
  const redirectPath = searchParams?.get("redirectTo") || "/"

  // Clear errors when inputs change
  const handleInputChange = useCallback(() => {
    if (error) {
      setError(null)
      setIsEmailVerificationError(false)
    }
  }, [error])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setIsEmailVerificationError(false)

    try {
      const supabase = getSupabaseClient()

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        // Check if it's an email verification error
        if (error.message?.includes("verify your email") || error.message?.includes("Email not confirmed")) {
          setIsEmailVerificationError(true)
        }

        // Use the error handler utility to get a user-friendly message
        setError(handleAuthError(error, "sign-in"))
        setIsLoading(false)
        return
      }

      // If we get here, sign-in was successful
      console.log("Sign-in successful, redirecting to", redirectPath)
      router.push(redirectPath)
      router.refresh() // Refresh to update server components
    } catch (err: any) {
      console.error("Unexpected error during sign-in:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle resending verification email
  const handleResendVerification = async () => {
    if (!email) return

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      })

      if (error) {
        setError(`Failed to resend verification email: ${error.message}`)
      } else {
        setError("Verification email sent. Please check your inbox.")
      }
    } catch (err) {
      setError("Failed to resend verification email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto" aria-labelledby="sign-in-heading">
      <h1 id="sign-in-heading" className="text-2xl font-bold text-center mb-6">
        Sign In
      </h1>

      {error && !isEmailVerificationError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEmailVerificationError && (
        <Alert variant="warning" role="alert" aria-live="assertive">
          <Mail className="h-4 w-4" />
          <AlertTitle>Email Verification Required</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Please verify your email address before signing in. Check your inbox for a verification link.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleResendVerification}
              disabled={isLoading}
            >
              Resend verification email
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            handleInputChange()
          }}
          placeholder="your.email@example.com"
          required
          disabled={isLoading}
          aria-required="true"
          autoComplete="email"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            handleInputChange()
          }}
          required
          disabled={isLoading}
          aria-required="true"
          autoComplete="current-password"
          className="w-full"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="text-center text-sm mt-4">
        Don't have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Sign up
        </Link>
      </div>
    </form>
  )
}
