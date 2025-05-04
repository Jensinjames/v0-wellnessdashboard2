import { Suspense } from "react"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFormLoading } from "@/components/auth/auth-layout"

export default function SignUpPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<AuthFormLoading />}>
        <SignUpForm />
      </Suspense>
    </AuthLayout>
  )
}
