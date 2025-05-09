"use client"

import { useEffect, useState } from "react"
import { EnhancedSignInForm } from "@/components/auth/enhanced-sign-in-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Suspense } from "react"

export default function SignInPage() {
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
    <AuthLayout title="Sign In" description="Enter your credentials to access your account">
      <Suspense fallback={<div className="p-4 text-center">Loading sign-in form...</div>}>
        <EnhancedSignInForm />
      </Suspense>
    </AuthLayout>
  )
}
