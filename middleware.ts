import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  const res = NextResponse.next()

  // Create a Supabase client specifically for the middleware
  const supabase = createMiddlewareClient({ req: request, res })

  // Get the session - this will check for a valid session cookie
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define protected routes that require authentication
  const protectedRoutes = ["/profile", "/dashboard", "/settings"]

  // Define auth routes that should redirect to profile if already logged in
  const authRoutes = ["/auth/login", "/auth/register", "/auth/reset-password"]

  // Get the current path
  const path = request.nextUrl.pathname

  // Check if the route is protected and user is not authenticated
  if (protectedRoutes.some((route) => path.startsWith(route)) && !session) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if the route is an auth route and user is already authenticated
  if (authRoutes.some((route) => path.startsWith(route)) && session) {
    return NextResponse.redirect(new URL("/profile", request.url))
  }

  // For all other routes, continue with the response
  return res
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Match all routes that should be protected or have special auth behavior
    "/profile/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/auth/:path*",
  ],
}
