"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, RefreshCw, Mail, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { authService } from "@/lib/auth-service"

interface EmailVerificationStatusProps {
  email: string
}

export function EmailVerificationStatus({ email }: EmailVerificationStatusProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const { resendVerificationEmail } = useAuth()

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { verified, error } = await authService.isEmailVerified(email)

        if (error) {
          setError(`Error checking verification status: ${error.message}`)
          setIsVerified(false)
        } else {
          setIsVerified(verified)
        }
      } catch (err: any) {
        setError(`Unexpected error: ${err.message}`)
        setIsVerified(false)
      } finally {
        setIsLoading(false)
      }
    }

    if (email) {
      checkVerification()
    }
  }, [email])

  const handleResendVerification = async () => {
    try {
      setIsResending(true)
      setError(null)

      const { success, error } = await resendVerificationEmail(email)

      if (!success) {
        setError(`Failed to resend verification email: ${error}`)
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`)
    } finally {
      setIsResending(false)
    }
  }

  const handleRefreshStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { verified, error } = await authService.isEmailVerified(email)

      if (error) {
        setError(`Error checking verification status: ${error.message}`)
      } else {
        setIsVerified(verified)

        // If verified, redirect to dashboard after a short delay
        if (verified) {
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        }
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Alert className="bg-blue-50">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking verification status...</AlertTitle>
        <AlertDescription>Please wait while we check if your email has been verified.</AlertDescription>
      </Alert>
    )
  }

  if (isVerified) {
    return (
      <Alert className="bg-green-50">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Email Verified!</AlertTitle>
        <AlertDescription>
          <p className="mb-2">Your email has been successfully verified.</p>
          <Button onClick={() => router.push("/dashboard")} size="sm">
            <ArrowRight className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-amber-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Email Not Verified</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          {"Your email "}
          <strong>{email}</strong>
          {
            " has not been verified yet. Please check your inbox and click the verification link in the email we sent you."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={handleResendVerification} variant="outline" size="sm" disabled={isResending}>
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>
          <Button onClick={handleRefreshStatus} size="sm" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Verification Status
              </>
            )}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </AlertDescription>
    </Alert>
  )
}
