import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { extractAuthToken } from "@/utils/auth-redirect"

// Token parameter name
const TOKEN_PARAM = "__v0_token"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    // Create a new supabase middleware client for each request
    const supabase = createMiddlewareClient({ req, res })

    // Check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Get the pathname and search from the URL
    const { pathname, search } = req.nextUrl
    const fullUrl = `${pathname}${search}`

    // Log the current request for debugging
    console.log(`Middleware processing: ${fullUrl}`)

    // Check if the URL contains an authentication token
    const token = extractAuthToken(fullUrl)

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

    // If there's a token in the URL, let the sign-in page handle it
    if (token && !pathname.startsWith("/auth/sign-in")) {
      console.log(`Auth token detected, redirecting to sign-in for processing`)

      // Extract the current path for redirection after token processing
      let redirectPath = pathname
      if (search) {
        // Remove the token from the search parameters
        const searchParams = new URLSearchParams(search)
        searchParams.delete(TOKEN_PARAM)

        // Add the remaining search parameters to the redirect path
        const remainingSearch = searchParams.toString()
        if (remainingSearch) {
          redirectPath += `?${remainingSearch}`
        }
      }

      // Encode the redirect path
      const encodedRedirect = encodeURIComponent(redirectPath)

      // Create the sign-in URL with the token and redirect path
      const signInUrl = new URL(`/auth/sign-in?redirectTo=${encodedRedirect}`, req.url)
      signInUrl.searchParams.set(TOKEN_PARAM, token)

      return NextResponse.redirect(signInUrl)
    }

    // Special handling for /app routes
    if (pathname.startsWith("/app")) {
      console.log(`Processing /app route: ${pathname}`)

      if (!session) {
        console.log("No session found for /app route, redirecting to sign-in")

        // Encode the full path including query parameters
        const encodedPath = encodeURIComponent(`${pathname}${search}`)
        const redirectUrl = new URL(`/auth/sign-in?redirectTo=${encodedPath}`, req.url)

        console.log(`Redirecting to: ${redirectUrl.toString()}`)

        // Create a response that redirects to the login page
        const redirectRes = NextResponse.redirect(redirectUrl)

        // Ensure cookies are properly set for the redirect
        const supabaseCookies = res.headers.getSetCookie()
        supabaseCookies.forEach((cookie) => {
          redirectRes.headers.append("Set-Cookie", cookie)
        })

        return redirectRes
      }

      console.log("User authenticated for /app route, proceeding")
      return res
    }

    // If the user is not authenticated and trying to access a protected route
    if (!session && !publicRoutes.some((route) => pathname.startsWith(route))) {
      console.log(`Unauthenticated access to protected route: ${pathname}`)

      // Encode the full path including query parameters
      const encodedPath = encodeURIComponent(`${pathname}${search}`)
      const redirectUrl = new URL(`/auth/sign-in?redirectTo=${encodedPath}`, req.url)

      console.log(`Redirecting to: ${redirectUrl.toString()}`)

      // Create a response that redirects to the login page
      const redirectRes = NextResponse.redirect(redirectUrl)

      // Ensure cookies are properly set for the redirect
      const supabaseCookies = res.headers.getSetCookie()
      supabaseCookies.forEach((cookie) => {
        redirectRes.headers.append("Set-Cookie", cookie)
      })

      return redirectRes
    }

    // User is authenticated, proceed with the request
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
