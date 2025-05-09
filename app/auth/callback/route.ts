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
    const supabase = createRouteHandlerClient({ cookies })

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
    } = await supabase.auth.getSession()

    // If the user is confirmed, redirect to the dashboard or the next URL
    if (session?.user?.email_confirmed_at) {
      return NextResponse.redirect(new URL(next, request.url))
    }

    // If the user is not confirmed, redirect to the verify email page
    return NextResponse.redirect(new URL("/auth/verify-email", request.url))
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    return NextResponse.redirect(new URL("/auth/sign-in?error=An unexpected error occurred", request.url))
  }
}
