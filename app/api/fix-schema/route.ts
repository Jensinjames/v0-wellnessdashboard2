/**
 * API Route to fix database schema issues
 */
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"
import { REQUIRED_TABLES, getTableCreationSQL, getMinimalTableSchema, type RequiredTable } from "@/utils/schema-check"

// Create a dedicated logger for schema operations
const logger = createLogger("SchemaFixAPI")

export async function POST(request: Request) {
  try {
    // Validate request
    const body = await request.json()

    if (!body.action || body.action !== "fix_schema") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get tables to fix
    const tablesToFix = body.tables || REQUIRED_TABLES

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

    // Results tracking
    const results: Record<string, { success: boolean; message: string }> = {}

    // Try to create each table
    for (const tableName of tablesToFix) {
      logger.info(`Attempting to create table: ${tableName}`)

      try {
        // First check if the table already exists
        const { error: checkError } = await supabase.from(tableName).select("*").limit(1)

        // If there's no error, the table already exists
        if (!checkError) {
          logger.info(`Table ${tableName} already exists`)
          results[tableName] = {
            success: true,
            message: "Table already exists",
          }
          continue
        }

        // Try to create the table using SQL
        // This is the preferred method but requires SQL execution privileges
        try {
          const tableSchema = getTableCreationSQL(tableName as RequiredTable)

          if (tableSchema) {
            const { error: sqlError } = await supabase.rpc("execute_sql", {
              sql_query: `CREATE TABLE IF NOT EXISTS ${tableName} (${tableSchema});`,
            })

            if (!sqlError) {
              logger.info(`Successfully created table ${tableName} using SQL`)
              results[tableName] = {
                success: true,
                message: "Created using SQL",
              }
              continue
            }

            logger.warn(`Failed to create table ${tableName} using SQL:`, sqlError)
          }
        } catch (sqlError) {
          logger.warn(`Exception creating table ${tableName} using SQL:`, sqlError)
        }

        // Fallback: Try to create the table using REST API
        try {
          const minimalSchema = getMinimalTableSchema(tableName as RequiredTable)

          const { error: insertError } = await supabase.from(tableName).insert([minimalSchema])

          if (!insertError) {
            logger.info(`Successfully created table ${tableName} using REST API`)
            results[tableName] = {
              success: true,
              message: "Created using REST API",
            }
            continue
          }

          if (insertError.message.includes("already exists")) {
            logger.info(`Table ${tableName} already exists (from insert error)`)
            results[tableName] = {
              success: true,
              message: "Table already exists (from insert error)",
            }
            continue
          }

          logger.warn(`Failed to create table ${tableName} using REST API:`, insertError)
          results[tableName] = {
            success: false,
            message: `Failed to create using REST API: ${insertError.message}`,
          }
        } catch (insertError) {
          logger.warn(`Exception creating table ${tableName} using REST API:`, insertError)
          results[tableName] = {
            success: false,
            message: `Exception creating using REST API: ${insertError instanceof Error ? insertError.message : "Unknown error"}`,
          }
        }
      } catch (error) {
        logger.error(`Error processing table ${tableName}:`, error)
        results[tableName] = {
          success: false,
          message: `Error processing table: ${error instanceof Error ? error.message : "Unknown error"}`,
        }
      }
    }

    // Determine overall success
    const allSuccess = Object.values(results).every((result) => result.success)

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? "All tables processed successfully" : "Some tables failed to process",
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Unexpected error in fix-schema API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
