import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware runs before any request is processed
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Only apply to specific API routes that need protection
  if (path.startsWith("/api/auth/edge-signup")) {
    // Check if the request is coming from our own domain
    const referer = request.headers.get("referer")
    const host = request.headers.get("host")

    // Basic CSRF protection - ensure the request is coming from our own site
    if (!referer || !host || !referer.includes(host)) {
      return NextResponse.json({ error: "Unauthorized request origin" }, { status: 403 })
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run only for specific paths
export const config = {
  matcher: ["/api/auth/:path*"],
}
