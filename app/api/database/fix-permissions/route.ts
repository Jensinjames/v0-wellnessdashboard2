import { NextResponse } from "next/server"
import { fixDatabaseGrantIssue } from "@/utils/direct-db-fixer"
import { createLogger } from "@/utils/logger"

const logger = createLogger("FixDatabasePermissionsAPI")

export async function POST() {
  try {
    logger.info("Starting direct database permission fix")

    // Use our direct fixer utility
    const result = await fixDatabaseGrantIssue()

    if (!result.success) {
      logger.error("Direct database fix failed:", result.message, result.details)
      return NextResponse.json(
        {
          error: result.message,
          details: result.details,
        },
        { status: 500 },
      )
    }

    logger.info("Successfully fixed database permissions", result.details)
    return NextResponse.json({
      success: true,
      message: "Successfully fixed database permissions",
      details: result.details,
    })
  } catch (error) {
    logger.error("Unexpected error fixing database permissions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
