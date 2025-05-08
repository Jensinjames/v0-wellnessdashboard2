import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseCredentials } from "@/lib/env"
import type { Database } from "@/types/database"

export async function middleware(request: NextRequest) {
  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get Supabase credentials
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in middleware")
    return response
  }

  // Create a Supabase client using the middleware cookie API
  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        const cookies = request.cookies.getAll()
        const cookie = cookies.find((cookie) => cookie.name === name)
        return cookie?.value
      },
      set(name: string, value: string, options) {
        // This is a workaround for middleware cookies
        // We're not actually setting cookies here, just passing them through
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set(name, value, options)
      },
      remove(name: string, options) {
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set(name, "", { ...options, maxAge: 0 })
      },
    },
  })

  // Refresh the session if it exists
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If there's no session and the user is trying to access a protected route
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    // Get the URL to redirect to after login
    const redirectTo = request.nextUrl.pathname + request.nextUrl.search

    // Redirect to the login page with the redirect URL
    const redirectUrl = new URL(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

// Define which routes are protected
function isProtectedRoute(pathname: string): boolean {
  // Add your protected routes here
  const protectedRoutes = [
    "/profile",
    "/dashboard",
    "/secure-dashboard",
    "/goals",
    "/categories",
    "/profile/verification",
    "/profile/complete",
    "/goals-hierarchy",
  ]

  // Check if the pathname starts with any of the protected routes
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - auth/callback (auth callback)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|auth/callback).*)",
  ],
}
