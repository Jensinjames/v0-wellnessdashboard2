"use client"

import { useEffect, useState } from "react"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Suspense } from "react"

export default function ForgotPasswordPage() {
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
    <AuthLayout title="Forgot Password" description="Enter your email to reset your password">
      <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
