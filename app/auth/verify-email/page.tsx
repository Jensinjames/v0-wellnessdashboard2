"use client"

import { useEffect, useState } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useAuth } from "@/context/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { EmailVerificationStatus } from "@/components/auth/email-verification-status"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"

export default function VerifyEmailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)
  const [email, setEmail] = useState<string>("")

  // Get email from query params or user object
  useEffect(() => {
    setIsClient(true)

    const emailParam = searchParams?.get("email")
    if (emailParam) {
      setEmail(emailParam)
    } else if (user?.email) {
      setEmail(user.email)
    }
  }, [searchParams, user])

  // Redirect if user is already verified
  useEffect(() => {
    if (isClient && !isLoading && user?.email_confirmed_at) {
      router.push("/dashboard")
    }
  }, [isClient, isLoading, user, router])

  if (!isClient) {
    return null
  }

  return (
    <AuthLayout title="Verify Your Email" description="Please verify your email address to continue">
      <Suspense
        fallback={
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>Loading verification status...</AlertDescription>
          </Alert>
        }
      >
        {email ? (
          <EmailVerificationStatus email={email} />
        ) : (
          <Alert>
            <AlertDescription>No email address found. Please go back to sign-in or sign-up.</AlertDescription>
          </Alert>
        )}
      </Suspense>
    </AuthLayout>
  )
}
