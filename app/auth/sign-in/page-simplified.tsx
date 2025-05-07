import type { Metadata } from "next"
import { EnhancedSignInForm } from "@/components/auth/enhanced-sign-in-form"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { AuthLayoutSimplified } from "@/components/auth/auth-layout-simplified"

export const metadata: Metadata = {
  title: "Sign In | Wellness Dashboard",
  description: "Sign in to your Wellness Dashboard account",
}

export default async function SignInPage() {
  // Check if user is already authenticated on the server
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If already authenticated, redirect to home
  if (session) {
    redirect("/")
  }

  return (
    <AuthLayoutSimplified>
      <EnhancedSignInForm />
    </AuthLayoutSimplified>
  )
}
