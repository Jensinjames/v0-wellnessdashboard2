import { Suspense } from "react"
import { AuthLayout, AuthFormLoading } from "@/components/auth/auth-layout"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFormLoading title="Reset Password" />}>
      <AuthLayout title="Reset Password" description="Enter your new password">
        <ResetPasswordForm />
      </AuthLayout>
    </Suspense>
  )
}
