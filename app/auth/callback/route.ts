import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createLogger } from "@/utils/logger"

const logger = createLogger("AuthCallbackRoute")

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")

    // If there's no code, redirect to sign-in
    if (!code) {
      return NextResponse.redirect(`${origin}/auth/sign-in`)
    }

    const supabaseServer = createServerClient()

    // Exchange the code for a session
    const { error } = await supabaseServer.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error("Error exchanging code for session:", error)
      return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`)
    }

    // Redirect to the dashboard on successful sign-in
    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (error) {
    logger.error("Unexpected error in auth callback:", error)
    return NextResponse.redirect(`${origin}/auth/sign-in?error=An unexpected error occurred`)
  }
}
