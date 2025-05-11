"use client"

import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import Link from "next/link"

export function VerificationReminder() {
  const { profile } = useAuth()

  // Don't show if no profile or if email is already verified
  if (!profile || profile.email_verified) {
    return null
  }

  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <Shield className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Verify your account</AlertTitle>
      <AlertDescription className="text-amber-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p>Enhance your account security by verifying your email address.</p>
          <Button asChild variant="outline" className="border-amber-300 hover:bg-amber-100 hover:text-amber-900">
            <Link href="/profile/verification">Verify Now</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
