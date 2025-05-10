import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function middleware(request: NextRequest) {
  try {
    // Create a Supabase client configured to use cookies
    const supabase = createClient()

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not signed in and the current path is not /auth/*, redirect to /auth/sign-in
    if (!session && !request.nextUrl.pathname.startsWith("/auth")) {
      const redirectUrl = new URL("/auth/sign-in", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and the current path is /auth/*, redirect to /
    if (session && request.nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
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
