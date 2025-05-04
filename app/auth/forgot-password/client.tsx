"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AuthFormLoading } from "@/components/auth/auth-layout"

// Dynamically import the ForgotPasswordForm with { ssr: false } to prevent server-side rendering
const ForgotPasswordForm = dynamic(
  () => import("@/components/auth/forgot-password-form").then((mod) => mod.ForgotPasswordForm),
  {
    ssr: false,
    loading: () => <AuthFormLoading />,
  },
)

export default function ForgotPasswordClient() {
  return (
    <Suspense fallback={<AuthFormLoading />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
