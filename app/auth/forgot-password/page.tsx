import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthFallback } from "@/components/auth/auth-fallback"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password" description="Enter your email to receive a password reset link">
      <ErrorBoundary fallback={<AuthFallback operation="password reset" />}>
        <ForgotPasswordForm />
      </ErrorBoundary>
    </AuthLayout>
  )
}
