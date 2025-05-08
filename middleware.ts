import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Simple middleware that doesn't rely on complex environment checks
export async function middleware(req: NextRequest) {
  // Create a simple Supabase client without cookie handling
  // This avoids the "createServerSupabaseClient should only be called on the server" error
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    return NextResponse.next()
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Get the user's session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Basic auth check for protected routes
    const { pathname } = req.nextUrl
    const isProtectedRoute = ["/dashboard", "/profile", "/goals", "/secure-dashboard"].some((route) =>
      pathname.startsWith(route),
    )

    if (isProtectedRoute && !session) {
      // Redirect to sign-in for protected routes when not authenticated
      const redirectUrl = new URL("/auth/sign-in", req.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Allow all other requests to proceed
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of an error, allow the request to proceed
    return NextResponse.next()
  }
}

// Configure the matcher to exclude static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
