import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseCredentials } from "@/lib/env"

export async function middleware(request: NextRequest) {
  // Create a response object
  const response = NextResponse.next()

  // Get Supabase credentials
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

  // Skip if credentials are missing
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in middleware")
    return response
  }

  try {
    // Create a Supabase client
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          // This is used for setting cookies from the server
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          // This is used for removing cookies from the server
          response.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          })
        },
      },
    })

    // Get the session
    const { data } = await supabase.auth.getSession()
    const session = data.session

    // Get the pathname
    const { pathname } = request.nextUrl

    // Define protected routes
    const protectedRoutes = ["/dashboard", "/profile", "/goals", "/secure-dashboard", "/categories"]

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

    // If the route is protected and there's no session, redirect to login
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL("/auth/sign-in", request.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Continue with the request
    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of an error, allow the request to proceed
    return response
  }
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}
