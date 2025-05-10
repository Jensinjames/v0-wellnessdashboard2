import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get("__v0_token")

  if (token) {
    // Strip the token param so it doesn't stick around
    url.searchParams.delete("__v0_token")

    // Set the Supabase auth cookie
    const res = NextResponse.redirect(url)

    // httpOnly so client JS can't accidentally overwrite it
    res.cookies.set("sb:token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    })

    return res
  }

  // Check for protected routes
  const { pathname } = url

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/callback",
    "/login",
  ]

  // Skip auth check for public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // For dashboard routes, we'll let the layout handle the auth check
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  // For the root path, redirect to dashboard if authenticated
  // This will be handled by the dashboard layout's auth check
  if (pathname === "/") {
    const dashboardUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run this on every non-API route
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
