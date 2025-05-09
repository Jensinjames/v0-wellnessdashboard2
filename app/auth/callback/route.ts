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
  const type = requestUrl.searchParams.get("type") || "signup"

  // If there's an error, redirect to the appropriate page with the error
  if (error) {
    console.error("Auth callback error:", error, error_description)

    // Determine where to redirect based on the type of auth flow
    const redirectPath = type === "recovery" ? "/auth/reset-password" : "/auth/sign-in"

    return NextResponse.redirect(
      new URL(`${redirectPath}?error=${encodeURIComponent(error_description || "Authentication error")}`, request.url),
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
    } = await supabase.auth.getSession()

    // Check if this is a password reset flow
    if (type === "recovery" && session) {
      return NextResponse.redirect(new URL("/auth/reset-password", request.url))
    }

    // For email confirmation and signup flows, redirect to the dashboard or specified next URL
    if (session) {
      // Create profile for new users if necessary
      if (type === "signup") {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single()

        if (!existingProfile) {
          // Create minimal profile
          await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              email: session.user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .single()
        }
      }

      return NextResponse.redirect(new URL(next, request.url))
    }

    // If we couldn't determine the user state, redirect to sign-in
    return NextResponse.redirect(new URL("/auth/sign-in", request.url))
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    return NextResponse.redirect(new URL("/auth/sign-in?error=An unexpected error occurred", request.url))
  }
}
