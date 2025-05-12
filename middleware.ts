import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ["/profile"]

  // Auth routes that should redirect to profile if already logged in
  const authRoutes = ["/auth/login", "/auth/register", "/auth/reset-password"]

  const path = request.nextUrl.pathname

  // Check if the route is protected and user is not authenticated
  if (protectedRoutes.some((route) => path.startsWith(route)) && !session) {
    const redirectUrl = new URL("/auth/login", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if the route is an auth route and user is already authenticated
  if (authRoutes.some((route) => path.startsWith(route)) && session) {
    const redirectUrl = new URL("/profile", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/profile/:path*", "/auth/:path*"],
}
