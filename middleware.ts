import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create supabase server client for middleware (this won't conflict with browser clients)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(
          name: string,
          value: string,
          options: {
            path: string
            maxAge: number
            domain?: string
            sameSite?: "lax" | "strict" | "none"
            secure?: boolean
          },
        ) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: { path: string; domain?: string }) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check auth condition
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth")

  // If accessing auth routes with a session, redirect to dashboard
  if (isAuthRoute && session && req.nextUrl.pathname !== "/auth/callback") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // If accessing protected routes without a session, redirect to sign in
  if (!isAuthRoute && !session) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url))
  }

  return res
}

export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/profile/:path*",
    "/categories/:path*",
    "/goals/:path*",
    // Auth routes
    "/auth/:path*",
  ],
}
