import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // If we don't have a session, something went wrong
    if (!session) {
      console.error("No session after code exchange")
      return NextResponse.redirect(
        new URL("/auth/sign-in?error=Failed to create session. Please try again.", request.url),
      )
    }

    // If the user is confirmed, redirect to the dashboard or the next URL
    if (session.user?.email_confirmed_at) {
      // Try to create a profile if it doesn't exist
      try {
        if (session.user.email) {
          const { error: profileError } = await supabase.from("profiles").upsert(
            {
              id: session.user.id,
              email: session.user.email,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id", ignoreDuplicates: false },
          )

          if (profileError) {
            console.warn("Error creating/updating profile during callback:", profileError)
            // Don't fail the auth flow, just log the error
          }
        }
      } catch (profileError) {
        console.error("Unexpected error creating profile during callback:", profileError)
        // Don't fail the auth flow, just log the error
      }

      return NextResponse.redirect(new URL(next, request.url))
    }

    // If the user is not confirmed, redirect to the verify email page
    // Include the email to make verification easier
    const email = session.user?.email
    const verifyUrl = email ? `/auth/verify-email?email=${encodeURIComponent(email)}` : "/auth/verify-email"

    return NextResponse.redirect(new URL(verifyUrl, request.url))
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    return NextResponse.redirect(new URL("/auth/sign-in?error=An unexpected error occurred", request.url))
  }
}
