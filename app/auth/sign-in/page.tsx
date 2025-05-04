import { Suspense } from "react"
import { SignInForm } from "@/components/auth/sign-in-form"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFormLoading } from "@/components/auth/auth-layout"

export default function SignInPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<AuthFormLoading />}>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  )
}
