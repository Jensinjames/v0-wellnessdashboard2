"use client"

import { useEffect, useState } from "react"
import { VerifyEmailForm } from "@/components/auth/verify-email-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Suspense } from "react"

export default function VerifyEmailPage() {
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
    <AuthLayout title="Verify Email" description="Verify your email address to continue">
      <Suspense fallback={<div className="p-4 text-center">Loading verification form...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  )
}
