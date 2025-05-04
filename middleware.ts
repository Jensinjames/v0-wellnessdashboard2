import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get the pathname from the URL
  const pathname = req.nextUrl.pathname

  // Protected routes
  const protectedRoutes = ["/dashboard", "/profile", "/categories", "/activity", "/settings"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Auth routes that should redirect if already logged in
  const authRoutes = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password", "/auth/reset-password"]
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Profile completion routes
  const profileCompletionRoutes = ["/profile/complete"]
  const isProfileCompletionRoute = profileCompletionRoutes.some((route) => pathname.startsWith(route))

  // Store the original URL to redirect back after authentication
  const returnToPath = pathname !== "/auth/sign-in" && pathname !== "/auth/sign-up" ? pathname : null

  // Handle authentication redirects
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/auth/sign-in", req.url)

    // Add the return path as a query parameter if it exists
    if (returnToPath) {
      redirectUrl.searchParams.set("redirect", returnToPath)
    }

    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session) {
    // Check if there's a redirect parameter
    const redirectParam = req.nextUrl.searchParams.get("redirect")

    // Redirect to the specified path or default to dashboard
    const redirectPath = redirectParam || "/dashboard"
    return NextResponse.redirect(new URL(redirectPath, req.url))
  }

  // Handle profile completion redirects
  if (session && !isProfileCompletionRoute && !isAuthRoute) {
    try {
      // Check if profile exists and is complete
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("completion_status")
        .eq("id", session.user.id)
        .single()

      // If profile doesn't exist or has incomplete status, redirect to profile completion
      if (error || !profile || !profile.completion_status || !profile.completion_status.is_complete) {
        // Only redirect if not already on a profile completion page
        if (!pathname.startsWith("/profile/complete")) {
          // Store the original URL to redirect back after profile completion
          const redirectUrl = new URL("/profile/complete", req.url)

          // Add the return path as a query parameter
          if (returnToPath) {
            redirectUrl.searchParams.set("redirect", returnToPath)
          }

          return NextResponse.redirect(redirectUrl)
        }
      }
    } catch (error) {
      console.error("Error checking profile completion:", error)
      // Continue without redirecting in case of error
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
