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
  const [mockSignUp, setMockSignUp] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

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
    if (!navigator.onLine) {
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
    setMockSignUp(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Check if we're online before attempting sign-up
    if (!navigator.onLine) {
      setNetworkError(true)
      setError("You appear to be offline. Sign-up requires an internet connection.")
      setIsLoading(false)
      return
    }

    try {
      const { error, mockSignUp: isMockSignUp, networkIssue } = await signUp({ email, password })

      if (error) {
        // Check if it's a network error
        if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("Network") ||
          error.message?.includes("network") ||
          error.message?.includes("connect")
        ) {
          setNetworkError(true)
          setError(
            "Network error: Unable to connect to the authentication service. Please check your internet connection.",
          )
        }
        // Check if it's a database error
        else if (error.message?.includes("Database error")) {
          console.log("Database error detected, proceeding with mock sign-up")
          // For database errors, we'll proceed with mock sign-up
          setMockSignUp(true)
          setTimeout(() => {
            router.push("/dashboard")
          }, 3000)
          return
        } else {
          setError(error.message)
        }
        setIsLoading(false)
        return
      }

      if (networkIssue) {
        setNetworkError(true)
        setError("Network issue detected. You've been signed up in offline mode.")
        setMockSignUp(true)

        // Wait a moment before redirecting to simulate the sign-up process
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
        return
      }

      if (isMockSignUp) {
        setMockSignUp(true)
        // Wait a moment before redirecting to simulate the sign-up process
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
        return
      }

      router.push("/auth/verify-email")
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
      } else {
        setError(err.message || "An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && !networkError && (
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {error}
        </Alert>
      )}

      {networkError && (
        <Alert className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
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
              >
                {isCheckingNetwork ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Checking...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" /> Check Connection
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-amber-100/50"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Reload Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {mockSignUp && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're being signed up in demo mode due to {networkError ? "network connectivity" : "database connectivity"}{" "}
            issues. You'll be redirected to the dashboard shortly.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || mockSignUp}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading || mockSignUp}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading || mockSignUp}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || mockSignUp || (networkError && !navigator.onLine)}
      >
        {isLoading ? "Signing up..." : mockSignUp ? "Redirecting..." : "Sign up"}
      </Button>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-500">
          Sign in
        </Link>
      </div>
    </form>
  )
}
