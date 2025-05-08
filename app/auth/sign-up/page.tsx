"use client"

import { useEffect, useState } from "react"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Suspense } from "react"

export default function SignUpPage() {
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
    <AuthLayout title="Sign Up" description="Create a new account to get started">
      <Suspense fallback={<div className="p-4 text-center">Loading sign-up form...</div>}>
        <SignUpForm />
      </Suspense>
    </AuthLayout>
  )
}
