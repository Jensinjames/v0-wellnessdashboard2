import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  // Extract query parameters
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next") || "/dashboard"
  const error = url.searchParams.get("error")

  // Redirect to the API route that handles the callback without using next/headers
  const redirectUrl = new URL("/api/auth/callback", request.url)

  // Forward all query parameters
  if (code) redirectUrl.searchParams.set("code", code)
  if (next) redirectUrl.searchParams.set("next", next)
  if (error) redirectUrl.searchParams.set("error", error)

  // Redirect to the API route
  return NextResponse.redirect(redirectUrl)
}
