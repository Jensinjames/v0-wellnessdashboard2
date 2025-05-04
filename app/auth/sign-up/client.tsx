"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AuthFormLoading } from "@/components/auth/auth-layout"

// Dynamically import the SignUpForm with { ssr: false } to prevent server-side rendering
const SignUpForm = dynamic(() => import("@/components/auth/sign-up-form"), {
  ssr: false,
  loading: () => <AuthFormLoading />,
})

export default function SignUpClient() {
  return (
    <Suspense fallback={<AuthFormLoading />}>
      <SignUpForm />
    </Suspense>
  )
}
