/**
 * Edge Function Health Check API
 * Endpoint for checking the health of Edge Functions
 */
import { NextResponse } from "next/server"
import { checkEdgeFunctionHealth } from "@/services/edge-function-service"

export async function GET() {
  try {
    const health = await checkEdgeFunctionHealth()
    return NextResponse.json(health)
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to check Edge Function health",
      },
      { status: 500 },
    )
  }
}
