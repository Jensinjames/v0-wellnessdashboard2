import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a new supabase middleware client for each request
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Get the pathname from the URL
    const { pathname } = req.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = [
      "/auth/sign-in",
      "/auth/sign-up",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify-email",
      "/auth/callback",
    ]

    // Routes that should bypass all checks
    const bypassAllChecks = [
      "/api/", // All API routes
      "/api/create-profile", // Explicitly allow profile creation API
      "/api/auth/", // All auth-related APIs
      "/api/health-check", // Health check endpoint
      "/_next/", // Next.js assets
      "/favicon.ico",
      "/manifest.json",
      "/robots.txt",
      ...publicRoutes,
    ]

    // Skip middleware completely for bypass routes
    if (bypassAllChecks.some((route) => pathname.startsWith(route))) {
      return res
    }

    // If the user is not authenticated and trying to access a protected route
    if (!session && !publicRoutes.some((route) => pathname.startsWith(route))) {
      const redirectUrl = new URL("/auth/sign-in", req.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of an error, allow the request to proceed
    // The client-side auth checks will handle authentication
    return res
  }
}

// Only run middleware on specific paths, excluding API routes
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - api/ (API routes)
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
}
