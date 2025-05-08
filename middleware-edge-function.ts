/**
 * Edge Function Middleware
 * Middleware for handling Edge Function requests
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware runs before any request is processed
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Only apply to specific API routes that need protection
  if (path.startsWith("/api/auth/edge-signup") || path.startsWith("/api/edge-function")) {
    // Check if the request is coming from our own domain
    const referer = request.headers.get("referer")
    const host = request.headers.get("host")
    const origin = request.headers.get("origin")

    // Basic CSRF protection - ensure the request is coming from our own site
    // Allow requests from the same host or from localhost during development
    const isLocalhost = host?.includes("localhost") || host?.includes("127.0.0.1")
    const isSameOrigin = origin && host && origin.includes(host)
    const isFromOurSite = referer && host && (referer.includes(host) || (isLocalhost && referer.includes("localhost")))

    if (!isFromOurSite && !isSameOrigin && !isLocalhost) {
      return NextResponse.json({ error: "Unauthorized request origin" }, { status: 403 })
    }

    // Add security headers
    const response = NextResponse.next()
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")

    return response
  }

  return NextResponse.next()
}

// Configure the middleware to run only for specific paths
export const config = {
  matcher: ["/api/auth/:path*", "/api/edge-function/:path*"],
}
