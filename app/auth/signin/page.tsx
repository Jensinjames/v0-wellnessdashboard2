"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function SignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refs for focus management
  const emailInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  // Check for registered=true query param
  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setSuccess("Account created successfully! Please sign in.")
    }
  }, [searchParams])

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
      const { success, message } = await signIn(email, password)

      if (!success) {
        setError(message)
        return
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Sign in error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8"
    >
      <Card className="w-full max-w-md" role="region" aria-labelledby="sign-in-title">
        <CardHeader className="space-y-1">
          <CardTitle id="sign-in-title" className="text-2xl font-bold">
            Sign in to your account
          </CardTitle>
          <CardDescription>Enter your email and password to sign in</CardDescription>
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

          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in form">
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
                disabled={isLoading}
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Forgot your password? Reset it here"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-busy={isLoading}
              aria-disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Signing in...</span>
                  <span className="sr-only">Please wait while we sign you in</span>
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Create a new account"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
