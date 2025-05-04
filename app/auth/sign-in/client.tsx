"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AuthFormLoading } from "@/components/auth/auth-layout"

// Dynamically import the SignInForm with { ssr: false } to prevent server-side rendering
const SignInForm = dynamic(() => import("@/components/auth/sign-in-form").then((mod) => mod.SignInForm), {
  ssr: false,
  loading: () => <AuthFormLoading />,
})

export default function SignInClient() {
  return (
    <Suspense fallback={<AuthFormLoading />}>
      <SignInForm />
    </Suspense>
  )
}
