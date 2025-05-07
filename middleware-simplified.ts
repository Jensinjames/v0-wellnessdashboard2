import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Routes that don't require authentication
const publicRoutes = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/callback",
]

// Routes that should bypass all checks
const bypassRoutes = ["/api/", "/_next/", "/favicon.ico", "/manifest.json", "/robots.txt"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Skip middleware for bypass routes
  if (bypassRoutes.some((route) => pathname.startsWith(route))) {
    return res
  }

  try {
    // Create a Supabase client for this request
    const supabase = createMiddlewareClient({ req, res })

    // Get the user's session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Allow access to public routes regardless of authentication
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      // If user is already authenticated and trying to access auth pages, redirect to home
      if (session && pathname !== "/auth/callback") {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return res
    }

    // For protected routes, check if the user is authenticated
    if (!session) {
      // Redirect to sign-in page with the original URL as a redirect parameter
      const redirectUrl = new URL("/auth/sign-in", req.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of an error, allow the request to proceed
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
