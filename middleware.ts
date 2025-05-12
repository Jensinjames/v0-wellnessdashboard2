import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple middleware that doesn't use next/headers or any hooks
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Empty matcher to avoid running middleware on any routes
export const config = {
  matcher: [],
}
