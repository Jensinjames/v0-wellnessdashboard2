import type { Metadata } from "next"
import { AuthLayout } from "@/components/auth/auth-layout"
import SignInClient from "./client"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
}

// Add config to disable static generation
export const dynamic = "force-dynamic"

export default function SignInPage() {
  return (
    <AuthLayout title="Sign In" redirectPath="/dashboard">
      <SignInClient />
    </AuthLayout>
  )
}
