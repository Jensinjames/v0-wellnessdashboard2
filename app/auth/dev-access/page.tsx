"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, AlertTriangle, ArrowLeft } from "lucide-react"

export default function DevAccessPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Only available in development mode
    if (process.env.NEXT_PUBLIC_APP_ENVIRONMENT !== "development") {
      router.push("/auth/sign-in")
      return
    }

    // Get the email from localStorage
    const storedEmail = localStorage.getItem("dev_temp_access")
    if (!storedEmail) {
      setError("No temporary access email found. Please set one using the console.")
    } else {
      setEmail(storedEmail)
    }
  }, [router])

  const handleContinue = () => {
    // In a real implementation, this would create a temporary access token
    // For now, we'll just redirect to the dashboard
    router.push("/dashboard")
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Link href="/auth/sign-in" className="inline-flex items-center text-blue-600 hover:text-blue-500">
            <ArrowLeft className="h-4 w-4 mr-1" /> Return to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <Alert className="bg-amber-50 text-amber-700 border-amber-200">
        <Info className="h-4 w-4 mr-2" />
        <AlertTitle>Development Mode Only</AlertTitle>
        <AlertDescription>
          This page is only available in development mode and provides temporary access for testing purposes.
        </AlertDescription>
      </Alert>

      {email && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h1 className="text-xl font-bold text-center">Development Access</h1>
          <p className="text-gray-600">
            Temporary access is being granted for <strong>{email}</strong> for testing purposes.
          </p>
          <div className="pt-2">
            <Button onClick={handleContinue} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>This is a development-only feature.</p>
            <p>In production, users would need to verify their email.</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/auth/sign-in" className="inline-flex items-center text-blue-600 hover:text-blue-500">
          <ArrowLeft className="h-4 w-4 mr-1" /> Return to sign in
        </Link>
      </div>
    </div>
  )
}
