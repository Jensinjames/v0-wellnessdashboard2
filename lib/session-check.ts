import { supabase } from "./supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function checkAuthSession(req: NextRequest) {
  try {
    // Get the session from the request cookie
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!data.session) {
      return {
        authenticated: false,
        error: "Auth session missing!",
        status: 401,
      }
    }

    return {
      authenticated: true,
      session: data.session,
      user: data.session.user,
    }
  } catch (error) {
    console.error("Session check error:", error)
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : "Authentication error",
      status: 500,
    }
  }
}

// Helper for API routes to verify authentication
export async function withAuth(req: NextRequest, handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  const auth = await checkAuthSession(req)

  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 })
  }

  return handler(req, auth.user)
}
