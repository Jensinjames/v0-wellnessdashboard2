import { Suspense } from "react"
import { AuthLayout, AuthFormLoading } from "@/components/auth/auth-layout"
import { SignUpForm } from "@/components/auth/sign-up-form"

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthFormLoading title="Sign Up" />}>
      <AuthLayout title="Sign Up" description="Create a new account to get started">
        <SignUpForm />
      </AuthLayout>
    </Suspense>
  )
}
