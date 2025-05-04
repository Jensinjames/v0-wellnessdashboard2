import { Suspense } from "react"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFormLoading } from "@/components/auth/auth-layout"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<AuthFormLoading />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
