import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFormLoading } from "@/components/auth/auth-layout"

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<AuthFormLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
