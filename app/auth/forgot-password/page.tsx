"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ForgotPassword() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refs for focus management
  const emailInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  // Set focus to email input on load
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])

  // Move focus to error or success message when they appear
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  useEffect(() => {
    if (success && successRef.current) {
      successRef.current.focus()
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const { success, message } = await resetPassword(email)

      if (!success) {
        setError(message)
        return
      }

      setSuccess(message || "Password reset instructions sent to your email.")

      // Announce success to screen readers
      const announcement = document.createElement("div")
      announcement.setAttribute("aria-live", "assertive")
      announcement.setAttribute("role", "status")
      announcement.className = "sr-only"
      announcement.textContent = "Password reset instructions sent to your email."
      document.body.appendChild(announcement)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Password reset error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8"
    >
      <Card className="w-full max-w-md" role="region" aria-labelledby="forgot-password-title">
        <CardHeader className="space-y-1">
          <CardTitle id="forgot-password-title" className="text-2xl font-bold">
            Reset your password
          </CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert
              variant="destructive"
              className="mb-4"
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              className="mb-4 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50"
              ref={successRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Password reset form">
            <div className="space-y-2">
              <Label htmlFor="email" className="block">
                Email
              </Label>
              <Input
                id="email"
                ref={emailInputRef}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || !!success}
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !!success}
              aria-busy={isLoading}
              aria-disabled={isLoading || !!success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Sending reset link...</span>
                  <span className="sr-only">Please wait while we send the reset link</span>
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Remember your password?{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Return to sign in page"
            >
              Back to sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
