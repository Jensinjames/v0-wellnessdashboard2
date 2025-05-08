/**
 * API Route to execute SQL directly
 * WARNING: This should only be used in admin contexts
 */
import { NextResponse } from "next/server"
import { executeSQLAdmin } from "@/utils/sql-executor"
import { createLogger } from "@/utils/logger"

const logger = createLogger("ExecuteSQLAPI")

export async function POST(request: Request) {
  try {
    // Validate request
    const body = await request.json()

    if (!body.sql) {
      return NextResponse.json({ error: "Missing SQL query" }, { status: 400 })
    }

    // Execute the SQL
    const result = await executeSQLAdmin(body.sql)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Unexpected error in execute-sql API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
