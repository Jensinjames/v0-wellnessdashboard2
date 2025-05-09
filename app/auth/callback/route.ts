import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  // If there's an error, redirect to the sign-in page with the error
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(error_description || "Authentication error")}`, request.url),
    )
  }

  // If there's no code, redirect to the sign-in page
  if (!code) {
    console.warn("No code provided in auth callback")
    return NextResponse.redirect(new URL("/auth/sign-in", request.url))
  }

  try {
    // Create a new supabase server client
    const supabase = await createServerSupabaseClient()

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?error=${encodeURIComponent(exchangeError.message)}`, request.url),
      )
    }

    // Get the user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error getting session after code exchange:", sessionError)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?error=${encodeURIComponent(sessionError.message)}`, request.url),
      )
    }

    // If no session was created, redirect to sign-in
    if (!session) {
      console.warn("No session created after code exchange")
      return NextResponse.redirect(new URL("/auth/sign-in?error=Failed to create session", request.url))
    }

    // Check if the user's email is confirmed
    if (session.user?.email_confirmed_at) {
      // If the user is confirmed, check if they have a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error checking user profile:", profileError)
      }

      // If the user doesn't have a profile, create one
      if (!profile) {
        try {
          // Create a basic profile
          await supabase.from("profiles").insert({
            id: session.user.id,
            email: session.user.email,
            updated_at: new Date().toISOString(),
          })

          // Log the profile creation event
          try {
            await supabase.from("user_changes_log").insert({
              user_id: session.user.id,
              action: "profile_created",
              new_values: { email: session.user.email },
              client_info: request.headers.get("user-agent") || "unknown",
            })
          } catch (logError) {
            // Don't fail if logging fails
            console.error("Error logging profile creation:", logError)
          }

          // Redirect to profile completion page
          return NextResponse.redirect(new URL("/profile/complete", request.url))
        } catch (error) {
          console.error("Error creating user profile:", error)
          // Continue to dashboard even if profile creation fails
          return NextResponse.redirect(new URL(next, request.url))
        }
      }

      // Check if the profile is complete
      const isProfileComplete = Boolean(profile.first_name && profile.last_name && profile.email)

      // If profile is incomplete, redirect to profile completion
      if (!isProfileComplete) {
        return NextResponse.redirect(new URL("/profile/complete", request.url))
      }

      // User has a complete profile, redirect to the next URL or dashboard
      return NextResponse.redirect(new URL(next, request.url))
    }

    // If the user is not confirmed, redirect to the verify email page
    return NextResponse.redirect(new URL("/auth/verify-email", request.url))
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    return NextResponse.redirect(new URL("/auth/sign-in?error=An unexpected error occurred", request.url))
  }
}
