import type { Metadata } from "next"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
}

export default function SignUpPage() {
  return (
    <AuthLayout title="Sign Up" redirectPath="/dashboard">
      <SignUpForm />
    </AuthLayout>
  )
}
