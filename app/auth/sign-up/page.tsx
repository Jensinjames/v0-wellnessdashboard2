"use client"

import { Suspense } from "react"
import SignUpForm from "@/components/auth/sign-up-form"
import { AuthLayout } from "@/components/auth/auth-layout"

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create an account"
      subtitle="Enter your information to get started"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/auth/sign-in"
    >
      <Suspense fallback={<div className="flex items-center justify-center p-4">Loading sign-up form...</div>}>
        <SignUpForm />
      </Suspense>
    </AuthLayout>
  )
}
