import type { Metadata } from "next"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
}

export default function SignInPage() {
  return (
    <AuthLayout title="Sign In" redirectPath="/dashboard">
      <SignInForm />
    </AuthLayout>
  )
}
