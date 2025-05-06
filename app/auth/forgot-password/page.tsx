import { Suspense } from "react"
import { AuthLayout, AuthFormLoading } from "@/components/auth/auth-layout"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthFormLoading title="Forgot Password" />}>
      <AuthLayout title="Forgot Password" description="Enter your email to receive a password reset link">
        <ForgotPasswordForm />
      </AuthLayout>
    </Suspense>
  )
}
