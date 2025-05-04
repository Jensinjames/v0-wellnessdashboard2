"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AuthFormLoading } from "@/components/auth/auth-layout"

// Dynamically import the ResetPasswordForm with { ssr: false } to prevent server-side rendering
const ResetPasswordForm = dynamic(
  () => import("@/components/auth/reset-password-form").then((mod) => mod.ResetPasswordForm),
  {
    ssr: false,
    loading: () => <AuthFormLoading />,
  },
)

export default function ResetPasswordClient() {
  return (
    <Suspense fallback={<AuthFormLoading />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
