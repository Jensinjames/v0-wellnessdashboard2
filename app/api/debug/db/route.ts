import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-client"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Test database connection by querying the user_profiles table
    const { data, error } = await supabase.from("user_profiles").select("count(*)", { count: "exact" })

    if (error) {
      throw error
    }

    // Return success response with count
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      count: data[0].count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database connection error:", error)

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
