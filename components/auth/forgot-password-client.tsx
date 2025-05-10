"use client"

import { useEffect } from "react"
import { EnhancedForgotPasswordForm } from "@/components/auth/enhanced-forgot-password-form"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { ClientOnly } from "@/components/client-only"

export function ForgotPasswordClient() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [isLoading, user, router])

  return (
    <ClientOnly fallback={<div className="p-4 text-center">Loading...</div>}>
      <EnhancedForgotPasswordForm />
    </ClientOnly>
  )
}
