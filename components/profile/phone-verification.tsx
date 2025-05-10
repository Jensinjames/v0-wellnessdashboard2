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
import { maskPhone, normalizePhoneNumber, isValidPhoneNumber } from "@/utils/verification-utils"
import { Loader2, Phone } from "lucide-react"

export function PhoneVerification() {
  const { profile } = useAuth()
  const {
    isLoading,
    error,
    success,
    verificationSent,
    requestVerification,
    submitVerification,
    updatePhone,
    verificationStatus,
    fetchVerificationStatus,
    resetState,
  } = useVerification()

  const [verificationCode, setVerificationCode] = useState("")
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || "")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isEditingPhone, setIsEditingPhone] = useState(!profile?.phone)

  // Fetch verification status on mount
  useEffect(() => {
    fetchVerificationStatus()
  }, [fetchVerificationStatus])

  // Update phone number state when profile changes
  useEffect(() => {
    if (profile?.phone) {
      setPhoneNumber(profile.phone)
    }
  }, [profile])

  // Handle phone number change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhoneNumber(value)

    if (value && !isValidPhoneNumber(value)) {
      setPhoneError("Please enter a valid phone number")
    } else {
      setPhoneError(null)
    }
  }

  // Handle save phone number
  const handleSavePhone = async () => {
    if (!phoneNumber || phoneError) return

    const normalized = normalizePhoneNumber(phoneNumber)
    const success = await updatePhone(normalized)

    if (success) {
      setIsEditingPhone(false)
    }
  }

  // Handle request verification
  const handleRequestVerification = async () => {
    if (!profile?.phone) return
    await requestVerification("phone", profile.phone)
  }

  // Handle submit verification
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationCode) return

    const success = await submitVerification("phone", verificationCode)
    if (success) {
      setVerificationCode("")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Phone Verification</CardTitle>
          {profile?.phone && <VerificationBadge verified={verificationStatus.phoneVerified} type="phone" />}
        </div>
        <CardDescription>Verify your phone number for additional security</CardDescription>
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
          {isEditingPhone ? (
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter your phone number"
                className={phoneError ? "border-red-500" : ""}
              />
              {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSavePhone}
                  disabled={isLoading || !phoneNumber || !!phoneError}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Phone Number"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingPhone(false)
                    setPhoneNumber(profile?.phone || "")
                    setPhoneError(null)
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {profile?.phone ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{maskPhone(profile.phone)}</span>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setIsEditingPhone(true)} disabled={isLoading}>
                      Change
                    </Button>
                  </div>

                  {!verificationStatus.phoneVerified && !verificationSent && (
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
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No phone number added yet</p>
                  <Button onClick={() => setIsEditingPhone(true)}>Add Phone Number</Button>
                </div>
              )}
            </>
          )}

          {verificationSent && (
            <form onSubmit={handleSubmitVerification} className="space-y-4 mt-4">
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

      {verificationStatus.phoneVerified && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">Your phone number has been verified.</p>
        </CardFooter>
      )}
    </Card>
  )
}
