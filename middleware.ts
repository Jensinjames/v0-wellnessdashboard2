import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Simplified middleware that doesn't rely on validateServerEnv
export async function middleware(request: NextRequest) {
  try {
    // Create a response object
    const response = NextResponse.next()

    // Get supabase URL and anon key directly from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Check if required environment variables are available
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Middleware: Missing required Supabase environment variables")
      return response
    }

    // Create a Supabase client configured to use cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })

    // Get the session from the request cookie
    const authCookie = request.cookies.get("sb-auth-token")?.value

    // If no auth cookie, redirect unauthenticated users from protected routes
    if (!authCookie && !request.nextUrl.pathname.startsWith("/auth")) {
      const redirectUrl = new URL("/auth/sign-in", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If auth cookie exists and user is on auth pages, redirect to home
    if (authCookie && request.nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)

    // In case of error, allow the request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Apply this middleware to all routes except static files, api routes, and _next
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.png$).*)",
  ],
}
