import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/database"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  if (code) {
    const response = NextResponse.redirect(new URL(next, request.url))

    // Create supabase client using cookies from the request/response
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
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
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: { path: string; domain?: string }) {
            response.cookies.set({ name, value: "", ...options, maxAge: 0 })
          },
        },
      },
    )

    await supabase.auth.exchangeCodeForSession(code)

    return response
  }

  // If no code, redirect to sign in
  return NextResponse.redirect(new URL("/auth/sign-in", request.url))
}
