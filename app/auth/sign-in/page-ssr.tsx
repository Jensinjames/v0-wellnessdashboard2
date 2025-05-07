import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@/lib/supabase-ssr"
import SignInFormSSR from "@/components/auth/sign-in-form-ssr"
import AuthLayout from "@/components/auth/auth-layout"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
}

export default async function SignInPage() {
  // Check if user is already signed in
  const cookieStore = cookies()
  const supabase = createServerComponentClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is already signed in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <AuthLayout>
      <SignInFormSSR />
    </AuthLayout>
  )
}
