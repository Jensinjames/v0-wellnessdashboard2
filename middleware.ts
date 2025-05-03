import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/"]

// Define routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/settings",
  "/activity",
  "/categories",
  "/activity-patterns",
  "/category-management",
  "/data-management",
  "/optimistic-ui-demo",
  "/optimistic-entry-demo",
  "/optimization-demo",
  "/error-boundary-demo",
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create supabase middleware client
  const supabase = createMiddlewareClient({ req, res })

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`),
  )

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(
    (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`),
  )

  // For API routes, let the route handler check auth
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return res
  }

  // For public routes, no need to check auth
  if (isPublicRoute && !isProtectedRoute) {
    return res
  }

  try {
    // Check session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session and trying to access protected route, redirect to login
    if (!session && isProtectedRoute) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirect", req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If session exists and trying to access auth routes (login, signup, etc.)
    if (session && isPublicRoute && req.nextUrl.pathname !== "/") {
      // Redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Continue with the request
    return res
  } catch (error) {
    console.error("Auth middleware error:", error)

    // On error, redirect to login if trying to access protected route
    if (isProtectedRoute) {
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
