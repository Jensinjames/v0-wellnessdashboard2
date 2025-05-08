/**
 * API Route to check if a table exists
 */
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("CheckTableAPI")

export async function GET(request: Request) {
  try {
    // Get table name from query params
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    // Create Supabase admin client
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", tableName)
      .limit(1)

    if (error) {
      logger.error(`Error checking if table ${tableName} exists:`, error)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // Return result
    return NextResponse.json({
      exists: data && data.length > 0,
      tableName,
    })
  } catch (error) {
    logger.error("Unexpected error in check-table API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
