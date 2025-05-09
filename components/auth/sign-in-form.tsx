"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { handleAuthError } from "@/utils/auth-error-handler"
import { sanitizeEmail, validateAuthCredentials } from "@/utils/auth-validation"
import { useToast } from "@/hooks/use-toast"

export function SignInForm() {
  const { signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [showRepairOption, setShowRepairOption] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const validateForm = () => {
    const { isValid, fieldErrors: errors } = validateAuthCredentials(email, password)
    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setShowRepairOption(false)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Sanitize the email before sending
      const sanitizedEmail = sanitizeEmail(email)

      const {
        error: signInError,
        mockSignIn,
        userId: returnedUserId,
      } = await signIn({
        email: sanitizedEmail,
        password,
      })

      if (signInError) {
        const errorMessage = handleAuthError(signInError, "sign-in")
        setError(errorMessage)

        // If the error is related to database permissions, show repair option
        if (
          errorMessage.includes("Database error") ||
          errorMessage.includes("database error") ||
          errorMessage.includes("permission denied")
        ) {
          setShowRepairOption(true)
          if (returnedUserId) {
            setUserId(returnedUserId)
          }
        }

        setIsLoading(false)
        return
      }

      if (mockSignIn) {
        toast({
          title: "Demo Mode",
          description: "You are signed in with demo credentials. Some features may be limited.",
          variant: "default",
        })
      } else {
        toast({
          title: "Success",
          description: "You have successfully signed in.",
          variant: "default",
        })
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Sign in error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepairAccount = async () => {
    if (!userId) {
      setError("Cannot repair account: User ID is missing")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/fix-user-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to repair account")
      }

      toast({
        title: "Account Repaired",
        description: "Your account permissions have been fixed. Please try signing in again.",
        variant: "default",
      })

      // Clear the form and reset state
      setShowRepairOption(false)
      setUserId(null)
    } catch (err: any) {
      console.error("Repair account error:", err)
      setError(`Failed to repair account: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-4 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="mt-2 text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showRepairOption && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertDescription className="flex flex-col gap-2">
            <p>Database permission issue detected. Would you like to repair your account?</p>
            <Button
              variant="outline"
              className="mt-2 border-amber-500 text-amber-700 hover:bg-amber-100"
              onClick={handleRepairAccount}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Repair Account
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            aria-invalid={fieldErrors.email ? "true" : "false"}
          />
          {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            aria-invalid={fieldErrors.password ? "true" : "false"}
          />
          {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isLoading}
          />
          <Label htmlFor="remember-me" className="text-sm font-normal">
            Remember me
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign In
        </Button>

        <div className="text-center text-sm">
          <Link href="/auth/sign-in?demo=true" className="text-primary hover:underline">
            Use Demo Mode
          </Link>
        </div>
      </form>
    </div>
  )
}
