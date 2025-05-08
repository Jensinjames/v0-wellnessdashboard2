import { NextResponse } from "next/server"
import { isServer } from "@/utils/environment"

export async function GET() {
  // Only check public variables that are safe to expose
  const publicVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
    NEXT_PUBLIC_APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "Not set (using default)",
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "Not set (using default)",
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE || "Not set (using default)",
    IS_SERVER: isServer() ? "Yes" : "No",
  }

  // Check server-side variables but don't expose their values
  const serverVarsStatus = {
    SUPABASE_URL: process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing",
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET ? "✓ Set" : "✗ Missing",
    DEBUG_MODE: process.env.DEBUG_MODE || "Not set (using default)",
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    publicVars,
    serverVarsStatus,
  })
}
