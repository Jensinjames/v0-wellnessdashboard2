import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // This is a simplified middleware that doesn't use next/headers
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
