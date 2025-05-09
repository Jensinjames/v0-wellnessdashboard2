"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { handleAuthError } from "@/utils/auth-error-handler"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"

export function VerifyEmailForm() {
  const [verificationCode, setVerificationCode] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if there's an email in the URL
    if (searchParams) {
      const emailParam = searchParams.get("email")
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam))
      }
    }
  }, [searchParams])

  // Check if there's a token in the URL (direct link verification)
  useEffect(() => {
    const checkUrlToken = async () => {
      if (searchParams) {
        const token = searchParams.get("token")
        if (token) {
          setIsVerifying(true)
          try {
            const supabase = await getSupabaseClient()
            const { error: verifyError } = await supabase.auth.verifyOtp({
              type: "email",
              token_hash: token,
            })

            if (verifyError) {
              setError(handleAuthError(verifyError, "email-verification"))
            } else {
              setSuccess(true)
              setTimeout(() => {
                router.push("/dashboard")
              }, 2000)
            }
          } catch (err: any) {
            setError(handleAuthError(err, "email-verification"))
          } finally {
            setIsVerifying(false)
          }
        }
      }
    }

    checkUrlToken()
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = await getSupabaseClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: "email",
        token: verificationCode,
        email: email || undefined,
      })

      if (verifyError) {
        setError(handleAuthError(verifyError, "email-verification"))
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: any) {
      setError(handleAuthError(err, "email-verification"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(handleAuthError(error, "email-verification"))
        return
      }

      alert(`A new verification email has been sent to ${email}`)
    } catch (err: any) {
      setError(handleAuthError(err, "email-verification"))
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="text-center p-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Verifying your email...</p>
      </div>
    )
  }

  if (success) {
    return (
      <Alert className="rounded-md bg-green-50 p-4 text-sm text-green-700">
        <CheckCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Email Verified</AlertTitle>
        <AlertDescription>Your email has been verified successfully. Redirecting to dashboard...</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="verification-code">Verification Code</Label>
          <Input
            id="verification-code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter the code from your email"
            required
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">Enter the verification code sent to your email address</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleResendVerification}
            disabled={isLoading || !email}
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Resend Code
          </Button>
        </div>
      </form>

      <div className="text-center text-sm mt-4">
        <Link
          href="/auth/sign-in"
          className="text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
