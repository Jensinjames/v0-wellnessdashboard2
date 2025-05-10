/**
 * API Route to get schema version
 */
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("SchemaVersionAPI")

export async function GET() {
  try {
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

    // Try to get schema version from a version table if it exists
    const { data: versionData, error: versionError } = await supabase
      .from("schema_version")
      .select("version")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!versionError && versionData) {
      return NextResponse.json({
        version: versionData.version,
        source: "schema_version table",
      })
    }

    // Fallback: Check for existence of key tables to determine version
    const { data: tablesData, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .in("table_name", ["user_changes_log", "profiles", "schema_version"])

    if (tablesError) {
      logger.error("Error checking tables:", tablesError)
      return NextResponse.json({ error: "Failed to determine schema version" }, { status: 500 })
    }

    // Determine version based on tables that exist
    const tables = tablesData.map((t) => t.table_name)
    let version = "unknown"

    if (tables.includes("user_changes_log") && tables.includes("profiles")) {
      version = "1.2.0" // Both user_changes_log and profiles exist
    } else if (tables.includes("profiles")) {
      version = "1.1.0" // Only profiles exists
    } else {
      version = "1.0.0" // Basic schema
    }

    return NextResponse.json({
      version,
      source: "table detection",
      tables,
    })
  } catch (error) {
    logger.error("Unexpected error in schema-version API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
