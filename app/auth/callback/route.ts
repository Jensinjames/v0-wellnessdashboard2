import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("AuthCallback")

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const redirectTo = requestUrl.searchParams.get("redirect") || "/"

    if (code) {
      const supabase = createClient()

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        logger.error("Error exchanging code for session", error)
        return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, request.url))
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (error) {
    logger.error("Unexpected error in auth callback", error)
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent("An unexpected error occurred during authentication")}`,
        request.url,
      ),
    )
  }
}
