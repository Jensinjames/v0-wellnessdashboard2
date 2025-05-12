import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Database } from "@/types/supabase"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code: string; next?: string; type?: string }
}) {
  const cookieStore = cookies()
  const redirectPath = searchParams.next || "/profile"

  // Special handling for password reset
  const isPasswordReset = searchParams.type === "recovery"
  const passwordResetPath = "/auth/reset-password/confirm"

  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 })
          },
        },
      },
    )

    const code = searchParams.code

    if (code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error("Error exchanging code for session:", error.message)
          return redirect(`/auth/error?message=${encodeURIComponent(error.message)}`)
        }
      } catch (exchangeError) {
        console.error("Exception during code exchange:", exchangeError)
        return redirect(`/auth/error?message=${encodeURIComponent("Failed to process authentication")}`)
      }
    }

    // For password reset, redirect to the password reset confirmation page
    if (isPasswordReset) {
      return redirect(passwordResetPath)
    }

    // URL to redirect to after sign in process completes
    return redirect(redirectPath)
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    return redirect(`/auth/error?message=${encodeURIComponent("An unexpected error occurred")}`)
  }
}
