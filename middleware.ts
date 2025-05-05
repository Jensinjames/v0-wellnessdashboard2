import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the request is for an auth page
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")

  // If user is signed in and trying to access auth page, redirect to dashboard
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // If user is not signed in and trying to access a protected page, redirect to sign in
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/add-entry") ||
    req.nextUrl.pathname.startsWith("/categories") ||
    req.nextUrl.pathname.startsWith("/analytics") ||
    req.nextUrl.pathname.startsWith("/settings") ||
    req.nextUrl.pathname.startsWith("/profile")

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhook|public).*)"],
}
