import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Helper function to handle auth redirects without using next/headers
export async function handleAuthRedirect(code: string | null, next = "/dashboard") {
  if (!code) {
    return { redirect: "/auth/sign-in", error: "No code provided" }
  }

  try {
    // Create a new supabase client for server-side operations
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return {
        redirect: `/auth/sign-in?error=${encodeURIComponent(exchangeError.message)}`,
        error: exchangeError.message,
      }
    }

    // Get the user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return {
        redirect: `/auth/sign-in?error=${encodeURIComponent(sessionError.message)}`,
        error: sessionError.message,
      }
    }

    if (!session) {
      return { redirect: "/auth/sign-in?error=Failed to create session", error: "No session created" }
    }

    // Check profile completion logic
    if (session.user?.email_confirmed_at) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (!profile) {
        try {
          await supabase.from("profiles").insert({
            id: session.user.id,
            email: session.user.email,
            updated_at: new Date().toISOString(),
          })
          return { redirect: "/profile/complete", success: true }
        } catch (error) {
          console.error("Error creating profile:", error)
          return { redirect: next, warning: "Profile creation failed" }
        }
      }

      const isProfileComplete = Boolean(profile.first_name && profile.last_name && profile.email)
      if (!isProfileComplete) {
        return { redirect: "/profile/complete", success: true }
      }

      return { redirect: next, success: true }
    }

    return { redirect: "/auth/verify-email", success: true }
  } catch (error) {
    console.error("Auth redirect error:", error)
    return {
      redirect: "/auth/sign-in?error=An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
