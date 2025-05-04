import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ["/dashboard", "/profile", "/categories"]
  const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  // Auth routes that should redirect if already logged in
  const authRoutes = ["/auth/sign-in", "/auth/sign-up"]
  const isAuthRoute = authRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  // Profile completion routes
  const profileCompletionRoutes = ["/profile/complete"]
  const isProfileCompletionRoute = profileCompletionRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  // Handle authentication redirects
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/auth/sign-in", req.url)
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/", req.url))
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
        if (!req.nextUrl.pathname.startsWith("/profile/complete")) {
          return NextResponse.redirect(new URL("/profile/complete", req.url))
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
