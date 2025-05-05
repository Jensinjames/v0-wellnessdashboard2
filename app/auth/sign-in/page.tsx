import { Suspense } from "react"
import { AuthLayout, AuthFormLoading } from "@/components/auth/auth-layout"
import { SignInForm } from "@/components/auth/sign-in-form"

export default function SignInPage() {
  return (
    <Suspense fallback={<AuthFormLoading title="Sign In" />}>
      <AuthLayout title="Sign In" description="Enter your credentials to access your account">
        <SignInForm />
      </AuthLayout>
    </Suspense>
  )
}
