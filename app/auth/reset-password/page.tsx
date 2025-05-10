"use client"

import { useEffect, useState } from "react"
import { EnhancedResetPasswordForm } from "@/components/auth/enhanced-reset-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Suspense } from "react"

export default function ResetPasswordPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isLoading && user) {
      router.push("/dashboard")
    }
  }, [isClient, isLoading, user, router])

  if (!isClient) {
    return null
  }

  return (
    <AuthLayout title="Reset Password" description="Create a new password for your account">
      <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
        <EnhancedResetPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
