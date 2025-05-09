import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/dashboard"

  console.log(`Auth callback with code: ${code ? "present" : "missing"}, redirectTo: ${redirectTo}`)

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    try {
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error.message)
        // Redirect to sign-in page with error
        return NextResponse.redirect(
          new URL(`/auth/sign-in?error=${encodeURIComponent("Authentication failed")}`, request.url),
        )
      }

      // Successfully authenticated, redirect to the specified path
      console.log(`Authentication successful, redirecting to: ${redirectTo}`)

      // Fix: Properly decode the redirect path
      let decodedRedirect = redirectTo
      try {
        decodedRedirect = decodeURIComponent(redirectTo)
      } catch (e) {
        console.error("Error decoding redirect path:", e)
      }

      // Ensure the path starts with /
      if (!decodedRedirect.startsWith("/")) {
        decodedRedirect = `/${decodedRedirect}`
      }

      return NextResponse.redirect(new URL(decodedRedirect, request.url))
    } catch (error) {
      console.error("Unexpected error in auth callback:", error)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?error=${encodeURIComponent("An unexpected error occurred")}`, request.url),
      )
    }
  }

  // No code present, redirect to home page
  console.log("No code present in auth callback, redirecting to home")
  return NextResponse.redirect(new URL("/", request.url))
}
