"use client"

import { useEffect, useState } from "react"
import { EnhancedForgotPasswordForm } from "@/components/auth/enhanced-forgot-password-form"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export function ForgotPasswordClient() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle redirect if user is already logged in
  useEffect(() => {
    if (mounted && !isLoading && user) {
      router.push("/dashboard")
    }
  }, [mounted, isLoading, user, router])

  if (!mounted) {
    return <div className="p-4 text-center">Loading...</div>
  }

  return <EnhancedForgotPasswordForm />
}
