import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { AuthFallback } from "@/components/auth/auth-fallback"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Suspense, ErrorBoundary } from "react"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a password reset link">
      <ErrorBoundary fallback={<AuthFallback operation="password reset" />}>
        <Suspense fallback={<div>Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </ErrorBoundary>
    </AuthLayout>
  )
}
