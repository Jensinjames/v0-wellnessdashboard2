import { NextResponse } from "next/server"
import { SERVER_ENV, validateServerEnv } from "@/lib/env-config"

export async function GET() {
  try {
    // Check server environment variables
    const validation = validateServerEnv()

    // Return sanitized environment info (no sensitive values)
    return NextResponse.json({
      status: "success",
      environment: process.env.NODE_ENV,
      valid: validation.valid,
      missing: validation.missing,
      variables: {
        SUPABASE_URL: !!SERVER_ENV.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!SERVER_ENV.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!SERVER_ENV.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_JWT_SECRET: !!SERVER_ENV.SUPABASE_JWT_SECRET,
      },
    })
  } catch (error) {
    console.error("Environment check error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
