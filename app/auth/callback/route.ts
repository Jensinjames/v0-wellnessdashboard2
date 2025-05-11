import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { createLogger } from "@/utils/logger"

const logger = createLogger("AuthCallback")

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const redirectTo = requestUrl.searchParams.get("redirect") || "/"
    const error = requestUrl.searchParams.get("error")
    const errorDescription = requestUrl.searchParams.get("error_description")

    // Handle OTP expired error
    if (error === "access_denied" && errorDescription?.includes("otp_expired")) {
      logger.error("OTP expired error:", errorDescription)
      return NextResponse.redirect(new URL("/auth/forgot-password?error=expired", request.url))
    }

    // Handle other errors
    if (error) {
      logger.error("Auth callback error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(errorDescription || "Authentication error")}`, request.url),
      )
    }

    if (code) {
      const supabase = createClient()

      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        logger.error("Error exchanging code for session:", exchangeError)

        // Check for OTP expired error
        if (exchangeError.message?.includes("otp_expired")) {
          return NextResponse.redirect(new URL("/auth/forgot-password?error=expired", request.url))
        }

        return NextResponse.redirect(
          new URL(`/auth/error?message=${encodeURIComponent(exchangeError.message)}`, request.url),
        )
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (error) {
    logger.error("Unexpected error in auth callback:", error)
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent("An unexpected error occurred during authentication")}`,
        request.url,
      ),
    )
  }
}
