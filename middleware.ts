import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create supabase middleware client
  const supabase = createMiddlewareClient({ req, res })

  // Check if the route requires authentication
  const isPublicRoute = publicRoutes.some((route) => req.nextUrl.pathname === route)

  // For API routes, let the route handler check auth
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return res
  }

  // For public routes, no need to check auth
  if (isPublicRoute) {
    return res
  }

  try {
    // Check session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session and not on a public route, redirect to login
    if (!session && !isPublicRoute) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirect", req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Continue with the request
    return res
  } catch (error) {
    console.error("Auth middleware error:", error)

    // On error, redirect to login
    if (!isPublicRoute) {
      const loginUrl = new URL("/login", req.url)
      return NextResponse.redirect(loginUrl)
    }

    return res
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Apply to all routes except static files, api routes, and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
