import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ForgotPasswordClient } from "@/components/auth/forgot-password-client"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password" description="Enter your email to reset your password">
      <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
        <ForgotPasswordClient />
      </Suspense>
    </AuthLayout>
  )
}
