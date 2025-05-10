"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DevAccessPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we're in development mode
    const isDev = process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development"
    setIsDevMode(isDev)

    if (!isDev) {
      return
    }

    // Get the email from localStorage
    const storedEmail = localStorage.getItem("dev_temp_access")
    if (storedEmail) {
      setEmail(storedEmail)
      setIsValid(true)
    }
  }, [])

  const handleContinue = () => {
    if (isValid && email) {
      // In a real implementation, you would create a temporary access token
      // For now, we'll just redirect to a mock reset page
      router.push(`/auth/reset-password?dev_mode=true&email=${encodeURIComponent(email)}`)
    }
  }

  if (!isDevMode) {
    return (
      <div className="space-y-4">
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          <AlertTitle>Development Mode Only</AlertTitle>
          <AlertDescription>
            This page is only available in development mode. Please use the normal password reset flow.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Link href="/auth/forgot-password" className="flex items-center text-sm text-blue-600 hover:text-blue-500">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Password Reset
          </Link>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="space-y-4">
        <Alert className="rounded-md bg-amber-50 p-4 text-sm text-amber-700" role="alert">
          <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
          <AlertTitle>Development Access</AlertTitle>
          <AlertDescription>
            No email found in localStorage. Please set a temporary access email by running the following in your browser
            console:
            <pre className="mt-2 bg-amber-100 p-2 rounded text-xs overflow-x-auto">
              localStorage.setItem('dev_temp_access', 'your.email@example.com');
            </pre>
            Then refresh this page.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Link href="/auth/forgot-password" className="flex items-center text-sm text-blue-600 hover:text-blue-500">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Password Reset
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Alert className="rounded-md bg-amber-50 p-4 text-sm text-amber-700" role="alert">
        <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
        <AlertTitle>Development Mode Access</AlertTitle>
        <AlertDescription>
          <p>
            This is a development-only feature to help test the password reset flow when email sending is unavailable.
          </p>
          <p className="mt-2">
            <strong>Email:</strong> {email}
          </p>
          <div className="mt-4">
            <Button onClick={handleContinue} className="w-full">
              Continue to Password Reset
            </Button>
          </div>
          <p className="mt-2 text-xs">Note: In production, users would receive an email with a secure token link.</p>
        </AlertDescription>
      </Alert>
      <div className="flex justify-center">
        <Link href="/auth/forgot-password" className="flex items-center text-sm text-blue-600 hover:text-blue-500">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Password Reset
        </Link>
      </div>
    </div>
  )
}
