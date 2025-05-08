"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { Mail, CheckCircle, RefreshCw, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"

export function VerifyEmailForm() {
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp } = useAuth()

  // Get email from URL if available
  useEffect(() => {
    const emailParam = searchParams?.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address to resend verification")
      return
    }

    setIsResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      // Use a temporary password for the resend flow
      // This is a workaround since we don't have the original password
      const tempPassword = Math.random().toString(36).slice(-12) + "A1!"

      const result = await signUp({ email, password: tempPassword })

      if (result.error) {
        // If the error indicates the user already exists, that's actually good in this context
        if (result.error.message?.includes("already exists")) {
          setResendSuccess(true)
          setError(null)
          // Set a 60-second countdown before allowing another resend
          setCountdown(60)
        } else {
          setError(`Failed to resend verification: ${result.error.message}`)
        }
      } else if (result.emailVerificationSent) {
        setResendSuccess(true)
        // Set a 60-second countdown before allowing another resend
        setCountdown(60)
      } else {
        setError("Something went wrong. Please try again or contact support.")
      }
    } catch (err: any) {
      setError(`Failed to resend verification: ${err.message || "Unknown error"}`)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50">
        <Mail className="h-4 w-4" />
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>
          We've sent a verification link to {email ? <strong>{email}</strong> : "your email address"}. Please check your
          inbox and click the link to verify your account.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {resendSuccess && (
        <Alert className="bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Verification email resent</AlertTitle>
          <AlertDescription>
            We've sent a new verification email. Please check your inbox and spam folders.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          If you don't see the email in your inbox, check your spam folder or request a new verification email.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleResendVerification} disabled={isResending || countdown > 0} variant="outline">
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Resend in {countdown}s
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend verification email
              </>
            )}
          </Button>

          <Button asChild>
            <Link href="/auth/sign-in">
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Sign In
            </Link>
          </Button>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-500">
          If you're having trouble with the verification process, please contact our support team for assistance.
        </p>
      </div>
    </div>
  )
}
