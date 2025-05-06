"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useVerification } from "@/hooks/use-verification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { VerificationBadge } from "@/components/profile/verification-badge"
import { maskEmail } from "@/utils/verification-utils"
import { Loader2, Mail } from "lucide-react"

export function EmailVerification() {
  const { profile } = useAuth()
  const {
    isLoading,
    error,
    success,
    verificationSent,
    requestVerification,
    submitVerification,
    verificationStatus,
    fetchVerificationStatus,
    resetState,
  } = useVerification()

  const [verificationCode, setVerificationCode] = useState("")

  // Fetch verification status on mount
  useEffect(() => {
    fetchVerificationStatus()
  }, [fetchVerificationStatus])

  // Handle request verification
  const handleRequestVerification = async () => {
    if (!profile?.email) return
    await requestVerification("email", profile.email)
  }

  // Handle submit verification
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationCode) return

    const success = await submitVerification("email", verificationCode)
    if (success) {
      setVerificationCode("")
    }
  }

  if (!profile?.email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>No email address found</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email Verification</CardTitle>
          <VerificationBadge verified={verificationStatus.emailVerified} type="email" />
        </div>
        <CardDescription>Verify your email address to secure your account</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{maskEmail(profile.email)}</span>
          </div>

          {!verificationStatus.emailVerified && !verificationSent && (
            <Button onClick={handleRequestVerification} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          )}

          {verificationSent && (
            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading || !verificationCode} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>

                <Button type="button" variant="outline" onClick={handleRequestVerification} disabled={isLoading}>
                  Resend Code
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>

      {verificationStatus.emailVerified && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">Your email address has been verified.</p>
        </CardFooter>
      )}
    </Card>
  )
}
