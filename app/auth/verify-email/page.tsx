import { Suspense } from "react"
import { VerifyEmailForm } from "@/components/auth/verify-email-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify Your Email"
      description="Please check your email for a verification link to complete your registration."
    >
      <Suspense fallback={<div>Loading verification status...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  )
}
