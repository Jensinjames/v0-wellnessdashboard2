import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for a client-side API route
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Get the environment variables
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Ensure the service key is not exposed to the client
    if (serviceKey) {
      // Remove sensitive headers from the request
      const headers = new Headers(request.headers)
      headers.delete("x-supabase-service-key")

      // Continue with the modified request
      return NextResponse.next({
        request: {
          headers,
        },
      })
    }
  }

  // Continue with the request for non-API routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
  ],
}
