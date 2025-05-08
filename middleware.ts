import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Define route types for better organization
const ROUTE_TYPES = {
  PUBLIC: "public", // Routes that don't require authentication
  PROTECTED: "protected", // Routes that require authentication
  AUTH_ONLY: "auth_only", // Routes that are only for authentication (redirect if already authenticated)
  API: "api", // API routes that handle their own auth
  STATIC: "static", // Static assets that bypass middleware
}

// Route configuration with more detailed settings
const ROUTES = {
  // Public routes that don't require authentication
  [ROUTE_TYPES.PUBLIC]: [
    "/", // Landing page
    "/about", // About page
    "/privacy", // Privacy policy
    "/terms", // Terms of service
    "/contact", // Contact page
  ],

  // Authentication routes - redirect to dashboard if already authenticated
  [ROUTE_TYPES.AUTH_ONLY]: ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password", "/auth/reset-password"],

  // Special auth routes that don't redirect even if authenticated
  [ROUTE_TYPES.PUBLIC]: ["/auth/verify-email", "/auth/callback"],

  // API routes that handle their own authentication
  [ROUTE_TYPES.API]: [
    "/api/", // All API routes
    "/api/create-profile", // Profile creation API
    "/api/auth/", // Auth-related APIs
    "/api/health-check", // Health check endpoint
    "/api/config", // Configuration API
  ],

  // Static assets and system routes that bypass middleware
  [ROUTE_TYPES.STATIC]: [
    "/_next/", // Next.js assets
    "/favicon.ico",
    "/manifest.json",
    "/robots.txt",
    "/sitemap.xml",
  ],

  // Protected routes that require authentication
  [ROUTE_TYPES.PROTECTED]: ["/dashboard", "/profile", "/goals", "/secure-dashboard", "/goals-hierarchy", "/categories"],
}

// Routes that require a complete profile
const ROUTES_REQUIRING_COMPLETE_PROFILE = ["/dashboard", "/goals", "/secure-dashboard"]

// Helper function to determine route type
function getRouteType(pathname: string): string {
  // Check static assets first for performance
  if (ROUTES[ROUTE_TYPES.STATIC].some((route) => pathname.startsWith(route))) {
    return ROUTE_TYPES.STATIC
  }

  // Check API routes
  if (ROUTES[ROUTE_TYPES.API].some((route) => pathname.startsWith(route))) {
    return ROUTE_TYPES.API
  }

  // Check auth-only routes
  if (ROUTES[ROUTE_TYPES.AUTH_ONLY].some((route) => pathname.startsWith(route))) {
    return ROUTE_TYPES.AUTH_ONLY
  }

  // Check public routes
  if (ROUTES[ROUTE_TYPES.PUBLIC].some((route) => pathname.startsWith(route))) {
    return ROUTE_TYPES.PUBLIC
  }

  // Default to protected
  return ROUTE_TYPES.PROTECTED
}

// Helper function to check if a profile is complete
function isProfileComplete(profile: any): boolean {
  return Boolean(profile && profile.first_name && profile.last_name && profile.email)
}

// Create a Supabase client for middleware
function createMiddlewareClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Skip middleware for static assets and API routes for performance
  const routeType = getRouteType(pathname)
  if (routeType === ROUTE_TYPES.STATIC || routeType === ROUTE_TYPES.API) {
    return res
  }

  try {
    // Create a Supabase client
    const supabase = createMiddlewareClient()

    // Get the user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Handle session errors
    if (sessionError) {
      console.error("Middleware session error:", sessionError)
      // Continue as if no session exists
    }

    const isAuthenticated = !!session?.user
    const isEmailVerified = !!session?.user?.email_confirmed_at

    // Special handling for email verification page
    if (pathname === "/auth/verify-email") {
      // If user is authenticated and email is verified, redirect to dashboard
      if (isAuthenticated && isEmailVerified) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      // Otherwise, allow access to verification page
      return res
    }

    // Handle auth-only routes (sign-in, sign-up, etc.)
    if (routeType === ROUTE_TYPES.AUTH_ONLY) {
      // If user is authenticated, redirect to dashboard
      if (isAuthenticated) {
        // Get the intended destination from the query string or default to dashboard
        const redirectTo = req.nextUrl.searchParams.get("redirectTo") || "/dashboard"
        return NextResponse.redirect(new URL(redirectTo, req.url))
      }
      // Otherwise, allow access to auth pages
      return res
    }

    // Handle public routes
    if (routeType === ROUTE_TYPES.PUBLIC) {
      // Allow access to public routes regardless of auth status
      return res
    }

    // Handle protected routes
    if (routeType === ROUTE_TYPES.PROTECTED) {
      // If user is not authenticated, redirect to sign-in
      if (!isAuthenticated) {
        const redirectUrl = new URL("/auth/sign-in", req.url)
        // Store the original URL to redirect back after sign-in
        redirectUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // If user is authenticated but email is not verified, redirect to verification page
      if (!isEmailVerified) {
        return NextResponse.redirect(new URL("/auth/verify-email", req.url))
      }

      // Check if the user has a complete profile for routes that require it
      if (ROUTES_REQUIRING_COMPLETE_PROFILE.some((route) => pathname.startsWith(route))) {
        try {
          // Fetch the user's profile
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email")
            .eq("id", session.user.id)
            .single()

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching profile in middleware:", profileError)
          }

          // If profile is incomplete, redirect to profile completion page
          if (!profile || !isProfileComplete(profile)) {
            return NextResponse.redirect(new URL("/profile/complete", req.url))
          }
        } catch (error) {
          console.error("Error checking profile completeness:", error)
          // Continue to allow access even if profile check fails
        }
      }

      // User is authenticated and meets requirements, allow access
      return res
    }

    // Default case - allow access
    return res
  } catch (error) {
    console.error("Middleware error:", error)

    // In case of an error, allow the request to proceed
    // The client-side auth checks will handle authentication
    return res
  }
}

// Configure the matcher to exclude static assets and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
