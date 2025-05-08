/**
 * Config API Route
 *
 * Provides safe configuration values to the client without exposing
 * sensitive environment variables directly.
 */
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { clientEnv } from "@/lib/env"

export async function GET() {
  try {
    // Create server client to verify authentication
    const supabase = createServerSupabaseClient()

    // Get session to check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Basic configuration available to all users
    const publicConfig = {
      appName: "Wellness Dashboard",
      version: clientEnv.APP_VERSION,
      environment: clientEnv.APP_ENVIRONMENT,
      features: {
        debugEnabled: clientEnv.DEBUG_MODE,
        profileEnabled: true,
        goalsEnabled: true,
        analyticsEnabled: true,
      },
      urls: {
        siteUrl: clientEnv.SITE_URL,
        termsUrl: `${clientEnv.SITE_URL}/terms`,
        privacyUrl: `${clientEnv.SITE_URL}/privacy`,
        supportUrl: `${clientEnv.SITE_URL}/support`,
      },
    }

    // If user is authenticated, provide additional configuration
    if (session) {
      return NextResponse.json({
        ...publicConfig,
        user: {
          id: session.user.id,
          email: session.user.email,
          lastSignIn: session.user.last_sign_in_at,
        },
        auth: {
          sessionExpiry: session.expires_at,
        },
      })
    }

    // Return public config for unauthenticated users
    return NextResponse.json(publicConfig)
  } catch (error) {
    console.error("Error in config API route:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}
